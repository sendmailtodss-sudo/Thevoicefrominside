export const WITNESS_RETENTION_MODE='scheduled-hourly-v1';
export const WITNESS_RETENTION_CRON='0 * * * *';
export const WITNESS_RETENTION_JOB='witness-expiry-v1';
export const WITNESS_RETENTION_MAX_AGE_MS=75*60*1000;
export async function witnessRetentionState(env,options={}){
 if(env.WITNESS_RETENTION_MODE!==WITNESS_RETENTION_MODE)return {ready:false,reason:'retention_not_configured',lastSuccessfulRun:null};
 if(!env.DB)return {ready:false,reason:'retention_unavailable',lastSuccessfulRun:null};
 try{const row=await env.DB.prepare('SELECT completed_at,scheduled_at,cron FROM retention_heartbeat WHERE job_id=?').bind(WITNESS_RETENTION_JOB).first();
  const now=Number(options.now??Date.now()),at=Date.parse(row?.completed_at||''),scheduled=Date.parse(row?.scheduled_at||'');
  if(!row||!Number.isFinite(at)||!Number.isFinite(scheduled)||row.cron!==WITNESS_RETENTION_CRON)return {ready:false,reason:'retention_not_verified',lastSuccessfulRun:null};
  if(at>now||scheduled>at||at-scheduled>15*60*1000||now-at>WITNESS_RETENTION_MAX_AGE_MS)return {ready:false,reason:'retention_stale',lastSuccessfulRun:row.completed_at};
  return {ready:true,reason:'retention_healthy',lastSuccessfulRun:row.completed_at};
 }catch{return {ready:false,reason:'retention_unavailable',lastSuccessfulRun:null};}
}
