import { describe, expect, test } from 'bun:test';
import { Effect } from 'effect';
import { decodeAnswer } from './telegram.ts';

const failureOf = <A>(effect: Effect.Effect<A, Error>): Promise<string> =>
  Effect.runPromise(Effect.map(Effect.flip(effect), (error) => error.message));

describe('decodeAnswer', () => {
  test('accepts a sent message', async () => {
    const sent = await Effect.runPromise(
      Effect.as(decodeAnswer({ ok: true, result: { message_id: 9 } }, 200), 'sent')
    );
    expect(sent).toBe('sent');
  });

  test('fails with the reason Telegram gives', async () => {
    const answer = { ok: false, error_code: 400, description: 'Bad Request: chat not found' };
    expect(await failureOf(decodeAnswer(answer, 400))).toContain('chat not found');
  });

  test('names the new chat id when the group became a supergroup', async () => {
    const answer = {
      ok: false,
      error_code: 400,
      description: 'Bad Request: group chat was upgraded to a supergroup chat',
      parameters: { migrate_to_chat_id: -1_001_234_567_890 },
    };
    expect(await failureOf(decodeAnswer(answer, 400))).toContain('-1001234567890');
  });

  test('fails on an answer of another shape', async () => {
    expect(await failureOf(decodeAnswer('<html>', 502))).toContain('502');
  });
});
