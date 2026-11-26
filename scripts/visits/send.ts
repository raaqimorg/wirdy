import { Array, Config, Console, Effect, Option, Schema } from 'effect';
import { argumentsOf, run } from '../run.ts';
import { pathVisitsOf, visitsOf } from './cloudflare.ts';
import {
  hourlyText,
  hourlyWindowsOf,
  isSilent,
  messageOf,
  morningText,
  morningWindowsOf,
  topOccasionOf,
} from './report.ts';
import { sendMessage } from './telegram.ts';

const USAGE = 'bun run visits <hourly|morning> [--silent]';

const program = Effect.gen(function* () {
  const [kind, silent] = yield* argumentsOf(
    Schema.Tuple([
      Schema.Literals(['hourly', 'morning']),
      Schema.optionalKey(Schema.Literal('--silent')),
    ]),
    USAGE
  );
  const forced = silent !== undefined;
  const analytics = {
    token: yield* Config.Redacted('CLOUDFLARE_API_TOKEN'),
    zone: yield* Config.String('CLOUDFLARE_ZONE_ID'),
  };
  const chat = {
    token: yield* Config.Redacted('TELEGRAM_BOT_TOKEN'),
    id: yield* Config.String('TELEGRAM_CHAT_ID'),
  };
  const name = Option.filter(
    yield* Config.option(Config.String('RECIPIENT_NAME')),
    (given) => given.trim() !== ''
  );
  const now = new Date();

  if (kind === 'hourly') {
    const windows = hourlyWindowsOf(now);
    const totals = yield* visitsOf(analytics, [windows.hour, windows.day]);
    const hour = Option.getOrElse(Array.get(totals, 0), () => 0);
    const day = Option.getOrElse(Array.get(totals, 1), () => 0);
    const body = hourlyText(windows, hour, day);
    yield* sendMessage(chat, messageOf(kind, name, body), isSilent(hour, forced));
  } else {
    const days = morningWindowsOf(now);
    const totals = yield* visitsOf(analytics, days);
    const rows = yield* pathVisitsOf(analytics, Array.headNonEmpty(days));
    const body = morningText(totals, topOccasionOf(rows));
    yield* sendMessage(chat, messageOf(kind, name, body), forced);
  }
  yield* Console.log(`sent ${kind}`);
});

run(program);
