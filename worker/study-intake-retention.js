import {STUDY_CRON,STUDY_RETENTION_JOB,requireStudy} from './study-intake-security.js';

// Trusted scheduled invocation only. No HTTP route can write this heartbeat.
// Cleanup deliberately runs while intake is disabled and needs no decryption key.
export async function runStudyIntakeRetention(controller,env,{now=Date.now()}={}){
 const scheduled=Number(controller?.scheduledTime);
 requireStudy(controller?.cron===STUDY_CRON&&Number.isFinite(now)&&Number.isFinite(scheduled)&&scheduled<=now&&now-scheduled<=900000,'invalid_retention_invocation');
 requireStudy(env.DB,'storage_unavailable',503);
 await env.DB.batch([
  env.DB.prepare('UPDATE study_intake_control SET version=version+1 WHERE study_id IN (SELECT study_id FROM study_intake_jobs WHERE metadata_expires_at<=?)').bind(now),
  env.DB.prepare("UPDATE study_intake_control SET publication_locked=1,version=version+1 WHERE study_id IN (SELECT study_id FROM study_intake_releases WHERE guard_expires_at<=? AND guard_ciphertext IS NOT NULL UNION SELECT study_id FROM study_intake_jobs WHERE metadata_expires_at<=? AND published_at IS NOT NULL)").bind(now,now),
  env.DB.prepare("UPDATE study_intake_jobs SET source_ciphertext=NULL,result_ciphertext=NULL,status=CASE WHEN status IN ('prepared','running') THEN 'expired' ELSE status END,version=version+1,updated_at=? WHERE content_expires_at<=? AND (source_ciphertext IS NOT NULL OR result_ciphertext IS NOT NULL)").bind(now,now),
  env.DB.prepare("UPDATE study_intake_jobs SET status='uncertain',failure_code='run_interrupted',source_ciphertext=NULL,run_token=NULL,version=version+1,updated_at=? WHERE status='running' AND run_started_at<?").bind(now,now-600000),
  env.DB.prepare('UPDATE study_intake_releases SET guard_ciphertext=NULL WHERE guard_expires_at<=?').bind(now),
  env.DB.prepare('DELETE FROM study_intake_jobs WHERE metadata_expires_at<=?').bind(now),
  env.DB.prepare(`INSERT INTO study_intake_retention(job_id,completed_at,scheduled_at,cron) VALUES(?,?,?,?) ON CONFLICT(job_id) DO UPDATE SET completed_at=excluded.completed_at,scheduled_at=excluded.scheduled_at,cron=excluded.cron WHERE excluded.scheduled_at>=study_intake_retention.scheduled_at AND excluded.completed_at>=study_intake_retention.completed_at`).bind(STUDY_RETENTION_JOB,now,scheduled,STUDY_CRON)
 ]);
 return{job:STUDY_RETENTION_JOB,completedAt:new Date(now).toISOString()};
}
