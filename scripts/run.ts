import { NodeRuntime, NodeServices } from '@effect/platform-node';
import { Data, Effect, Schema } from 'effect';

export class UsageError extends Data.TaggedError('UsageError')<{ readonly message: string }> {}

export const argumentsOf = <A>(
  schema: Schema.Decoder<A>,
  usage: string,
  given: ReadonlyArray<string> = process.argv.slice(2)
) =>
  Effect.mapError(
    Schema.decodeUnknownEffect(schema)(given),
    () => new UsageError({ message: `usage: ${usage}` })
  );

export const today = Effect.sync(() => new Date().toISOString().slice(0, 10));

export const run = <A, E>(program: Effect.Effect<A, E, NodeServices.NodeServices>): void => {
  NodeRuntime.runMain(Effect.provide(program, NodeServices.layer));
};
