import {purgeExpiredWitnessRecords} from './witness-ledger.js';
import {WITNESS_RETENTION_CRON,WITNESS_RETENTION_JOB} from './retention-state.js';

// Called only by the Worker's scheduled event. There is deliberately no HTTP
// maintenance route and no client-writeable heartbeat endpoint.
export async function runScheduledRetention(controller,env,options={}){
 const now=Number(options.now??Date.now()),scheduled=Number(controller?.scheduledTime);
 if(controller?.cron!==WITNESS_RETENTION_CRON)throw new Error('Unexpected retention schedule.');
 if(!Number.isFinite(now)||!Number.isFinite(scheduled)||scheduled>now||now-scheduled>15*60*1000)throw new Error('Retention invocation time is invalid or stale.');
 if(!env.DB)throw new Error('Retention storage unavailable.');
 // Continue cleanup even when new witness submissions have been disabled.
 // A successful current cleanup is necessary but not sufficient to open intake:
 // the dedicated mode flag and reviewer configuration are separately required.
 const cleanup=await purgeExpiredWitnessRecords(env,{now});
 const completedAt=new Date(now).toISOString(),scheduledAt=new Date(scheduled).toISOString();
 await env.DB.prepare(`INSERT INTO retention_heartbeat(job_id,completed_at,scheduled_at,cron,expired_records) VALUES(?,?,?,?,?)
 ON CONFLICT(job_id) DO UPDATE SET completed_at=excluded.completed_at,scheduled_at=excluded.scheduled_at,cron=excluded.cron,expired_records=excluded.expired_records
 WHERE excluded.scheduled_at>=retention_heartbeat.scheduled_at AND excluded.completed_at>=retention_heartbeat.completed_at`).bind(WITNESS_RETENTION_JOB,completedAt,scheduledAt,WITNESS_RETENTION_CRON,cleanup?.expiredRecords||0).run();
 return {job:WITNESS_RETENTION_JOB,completedAt,expiredRecords:cleanup?.expiredRecords||0};
}
export async function handleRetentionScheduled(controller,env,ctx){
 const work=runScheduledRetention(controller,env);
 if(ctx?.waitUntil)ctx.waitUntil(work);
 return await work;
}
