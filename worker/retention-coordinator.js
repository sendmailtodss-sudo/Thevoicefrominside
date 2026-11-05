import {runScheduledRetention} from './retention.js';
import {runStudyIntakeRetention} from './study-intake-retention.js';

// Each subsystem commits its own cleanup and heartbeat. Failure of one must
// not prevent the other from deleting expired private material.
export async function runRetentionJobs(controller, env, options = {}) {
  const names = ['witness', 'study-intake'];
  const outcomes = await Promise.allSettled([
    runScheduledRetention(controller, env, options),
    runStudyIntakeRetention(controller, env, options)
  ]);
  const failed = names.filter((_, i) => outcomes[i].status === 'rejected');
  if (failed.length) throw new Error('Retention jobs failed: ' + failed.join(', '));
  return {completed: names};
}
export async function handleScheduledRetention(controller, env, ctx) {
  const work = runRetentionJobs(controller, env);
  if (ctx?.waitUntil) ctx.waitUntil(work);
  return await work;
}
