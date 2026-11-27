import { ConfigProvider, Effect } from 'effect';
import { sendVisits } from './visits.ts';

type Controller = { readonly scheduledTime: number };

export default {
  scheduled: (controller: Controller, env: Readonly<Record<string, unknown>>): Promise<void> =>
    Effect.runPromise(
      sendVisits(new Date(controller.scheduledTime), false).pipe(
        Effect.provideService(ConfigProvider.ConfigProvider, ConfigProvider.fromUnknown(env))
      )
    ),
};
