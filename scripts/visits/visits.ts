import { Array, Config, Console, Effect, Option } from 'effect';
import { visitsOf } from './cloudflare.ts';
import { isSilent, nameOf, reportText, windowsOf } from './report.ts';
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
    const totals = yield* visitsOf(analytics, [windows.halfHour, windows.day]);
    const halfHour = Option.getOrElse(Array.get(totals, 0), () => 0);
    const day = Option.getOrElse(Array.get(totals, 1), () => 0);
    yield* sendMessage(chat, reportText(windows, halfHour, day, name), isSilent(halfHour, forced));
    yield* Console.log('sent');
  });
