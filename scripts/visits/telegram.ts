import { Data, Effect, Redacted, Schema } from 'effect';

export class TelegramFailed extends Data.TaggedError('TelegramFailed')<{
  readonly message: string;
}> {}

export type Chat = { readonly token: Redacted.Redacted; readonly id: string };

const answerSchema = Schema.Struct({
  ok: Schema.Boolean,
  description: Schema.optionalKey(Schema.String),
  parameters: Schema.optionalKey(
    Schema.Struct({ migrate_to_chat_id: Schema.optionalKey(Schema.Number) })
  ),
});

const failed = (message: string) => new TelegramFailed({ message: `telegram: ${message}` });

export const decodeAnswer = (json: unknown, status: number) =>
  Effect.gen(function* () {
    const answer = yield* Effect.mapError(Schema.decodeUnknownEffect(answerSchema)(json), () =>
      failed(`answered ${String(status)} with an unknown shape`)
    );
    if (answer.ok) return;
    const moved = answer.parameters?.migrate_to_chat_id;
    const reason = answer.description ?? `answered ${String(status)}`;
    return yield* failed(
      moved === undefined ? reason : `${reason}; set TELEGRAM_CHAT_ID to ${String(moved)}`
    );
  });

export const sendMessage = (chat: Chat, text: string, silent: boolean) =>
  Effect.gen(function* () {
    const token = Redacted.value(chat.token);
    const reason = (cause: unknown) =>
      failed((cause instanceof Error ? cause.message : String(cause)).replaceAll(token, '<token>'));
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: chat.id,
            text,
            parse_mode: 'HTML',
            disable_notification: silent,
          }),
          signal: AbortSignal.timeout(30_000),
        }),
      catch: reason,
    });
    const json = yield* Effect.tryPromise({
      try: (): Promise<unknown> => response.json(),
      catch: () => failed(`answered ${String(response.status)} with no JSON`),
    });
    return yield* decodeAnswer(json, response.status);
  });
