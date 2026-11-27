import { Config, Console, Effect, Option } from 'effect';
import { detailsOf, totalsOf } from './cloudflare.ts';
import { alertText, isFinished, isSilent, nameOf, reportText, windowsOf } from './report.ts';
import { sendMessage } from './telegram.ts';

export const sendVisits = (now: Date, forced: boolean) =>
  Effect.gen(function* () {
    const analytics = {
      token: yield* Config.Redacted('CLOUDFLARE_API_TOKEN'),
      zone: yield* Config.String('CLOUDFLARE_ZONE_ID'),
    };
    const chat = {
      token: yield* Config.Redacted('TELEGRAM_BOT_TOKEN'),
      id: yield* Config.String('TELEGRAM_CHAT_ID'),
    };
    const names = yield* Config.option(Config.String('RECIPIENT_NAME'));
    const name = Option.flatMap(names, (given) => nameOf(given, Math.random()));
    const windows = windowsOf(now);
    const totals = yield* totalsOf(analytics, windows);
    const details = isFinished(windows)
      ? yield* Effect.option(
          detailsOf(analytics, windows.day).pipe(
            Effect.tapError((error) => Console.error(error.message))
          )
        )
      : Option.none();
    yield* sendMessage(
      chat,
      reportText(windows, totals, details, name),
      isSilent(totals.hour, forced)
    );
    yield* Option.match(Option.flatMap(details, alertText), {
      onNone: () => Effect.void,
      onSome: (text) => sendMessage(chat, text, true),
    });
    yield* Console.log('sent');
  });
