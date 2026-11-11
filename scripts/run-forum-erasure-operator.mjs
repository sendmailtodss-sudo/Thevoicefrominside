/* Explicit operator tool; never run by build, HTTP routes, or a scheduler. */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {createErasureClient,planSyntheticErasure,executeSyntheticErasure} from '../server/forum-erasure-operator.mjs';
const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
const required=['--run-private-synthetic-erasure','--credentials','--fixture','--account','--job-id','--project-ref','--out'];
if(required.some(k=>!args.includes(k))||args.includes('--execute')&&args.includes('--dry-run')){console.error('Explicit synthetic erasure requires --run-private-synthetic-erasure --credentials PRIVATE_ENV --fixture PRIVATE_FIXTURE --account LABEL --job-id UUID --project-ref PINNED_REF --out PRIVATE_NEW_OUTPUT [--dry-run | --execute --reviewed-plan PRIVATE_PLAN --expected-plan-sha SHA256]');process.exit(2);}
const out=path.resolve(get('--out'));fs.mkdirSync(out,{recursive:true,mode:0o700});fs.chmodSync(out,0o700);
const mode=args.includes('--execute')?'execute':'dry_run',reportPath=path.join(out,mode==='execute'?'EXECUTION-RESULT.json':'DRY-RUN-PLAN.json');if(fs.existsSync(reportPath)||fs.existsSync(path.join(out,'OPERATOR-INTENT.json')))throw Error('existing_operator_intent_requires_reconciliation');
const privateRead=p=>{p=path.resolve(p);if(fs.statSync(p).mode&0o077)throw Error('input_file_must_be_private');return fs.readFileSync(p,'utf8');};
const parsePrivate=(text,label)=>{try{return JSON.parse(text);}catch{throw Error(label);}};
const values={};for(const l of privateRead(get('--credentials')).split('\n'))if(l&&!l.startsWith('#')&&l.includes('=')){const i=l.indexOf('=');values[l.slice(0,i)]=parsePrivate(l.slice(i+1),'invalid_private_env_encoding');}
const fixture=parsePrivate(privateRead(get('--fixture')),'invalid_private_fixture_encoding'),account=fixture.accounts?.[get('--account')];if(!account)throw Error('fixture_account_missing');
const subject={userId:account.id,email:account.email,intentId:fixture.intentId,jobId:get('--job-id')};
const client=createErasureClient({url:values.SFI_EU_SUPABASE_URL,serviceKey:values.SFI_EU_SUPABASE_SERVICE_ROLE_KEY,expectedProjectRef:get('--project-ref')});
const intent={intentId:crypto.randomUUID(),startedUtc:new Date().toISOString(),mode,projectRef:client.projectRef,jobId:subject.jobId,subjectId:subject.userId,syntheticOnly:true,production:false};fs.writeFileSync(path.join(out,'OPERATOR-INTENT.json'),JSON.stringify(intent,null,2)+'\n',{mode:0o600});
try{
 let result;
 if(mode==='execute'){
  if(!args.includes('--reviewed-plan')||!args.includes('--expected-plan-sha'))throw Error('explicit_reviewed_plan_required');
  const bytes=privateRead(get('--reviewed-plan')),sha=crypto.createHash('sha256').update(bytes).digest('hex');if(!/^[0-9a-f]{64}$/.test(get('--expected-plan-sha')||'')||sha!==get('--expected-plan-sha'))throw Error('reviewed_plan_sha_mismatch');
  result=await executeSyntheticErasure(client,subject,parsePrivate(bytes,'invalid_reviewed_plan_encoding'));result={...intent,...result,reviewedPlanSha256:sha,completedUtc:new Date().toISOString()};
 }else{result=await planSyntheticErasure(client,subject);result={...result,dryRun:true,noMutations:true};}
 const bytes=JSON.stringify(result,null,2)+'\n';fs.writeFileSync(reportPath,bytes,{mode:0o600});console.log(JSON.stringify({mode,state:result.state,passed:mode==='dry_run'||result.state==='completed',report:reportPath,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),providerDeletionCompleted:result.providerDeletionCompleted??false}));if(mode==='execute'&&result.state!=='completed')process.exitCode=1;
}catch(e){const failure={...intent,state:'stopped',failureCode:/^[a-z_]+$/.test(e.message||'')?e.message:'operator_or_transport_error',providerDeletionCompleted:false,completedUtc:new Date().toISOString()};fs.writeFileSync(reportPath,JSON.stringify(failure,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({mode,state:'stopped',code:failure.failureCode,report:reportPath}));process.exitCode=1;}
