const COURTS=new Set(['Gulating','Borgarting','Eidsivating','Agder','Frostating','Hålogaland','Norge samlet']);
const FIELDS=['court','year','defendantSex','population','coverage','sourceUrl','fullAcquittal','mixedOutcome','allConvicted','otherOutcome','unknownOutcome'];
export function wilson(successes,total){if(total===0)return null;const z=1.959963984540054,p=successes/total,div=1+z*z/total,mid=(p+z*z/(2*total))/div,delta=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/div;return {lower:Math.max(0,mid-delta),upper:Math.min(1,mid+delta)};}
export function validateRows(rows){
 if(!Array.isArray(rows)||rows.length<1||rows.length>500)throw Error('Use 1–500 aggregate rows.');
 const keys=new Set();return rows.map((r,i)=>{
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==FIELDS.length||FIELDS.some(k=>!Object.hasOwn(r,k)))throw Error('Row '+(i+1)+': unexpected or missing fields.');
  if(!COURTS.has(r.court)||!Number.isInteger(r.year)||r.year<2019||r.year>2025||!['male','female','unknown'].includes(r.defendantSex)||!['all_eligible_cases','published_decisions'].includes(r.population)||!['complete','restricted','unknown'].includes(r.coverage))throw Error('Row '+(i+1)+': invalid court, full year, sex, population or coverage.');
  let u;try{u=new URL(r.sourceUrl);}catch{throw Error('A source URL is required.');}if(u.protocol!=='https:'||u.username||u.password||r.sourceUrl.length>1500)throw Error('Use a public HTTPS source URL.');
  for(const k of FIELDS.slice(6))if(!Number.isSafeInteger(r[k])||r[k]<0||r[k]>10000000)throw Error('Row '+(i+1)+': missing counts must not be replaced with zero. Counts must be non-negative integers.');
  const key=[r.court,r.year,r.defendantSex,r.population].join('|');if(keys.has(key))throw Error('Duplicate court/year/sex/population group.');keys.add(key);
  return Object.fromEntries(FIELDS.map(k=>[k,r[k]]));
 });
}
export function analyseRows(rows){return validateRows(rows).map(r=>{const denominator=r.fullAcquittal+r.mixedOutcome+r.allConvicted,total=denominator+r.otherOutcome+r.unknownOutcome;return {...r,unit:'defendant_case',classifiedGuiltOutcomes:denominator,totalReported:total,fullAcquittalRate:denominator?r.fullAcquittal/denominator:null,allConvictedRate:denominator?r.allConvicted/denominator:null,wilson95:wilson(r.fullAcquittal,denominator),sourceVerifiedByTool:false,publicationReady:false,interpretation:r.population==='published_decisions'?'Selected published decisions only; not a population acquittal rate.':r.coverage==='complete'?'Source declares complete coverage; this tool has not independently verified that claim.':'Coverage incomplete or unknown; do not generalise to the court population.'};});}
export function parseData(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>262144)throw Error('Maximum file size: 256 KiB.');let data;try{data=JSON.parse(text);}catch{throw Error('Use valid JSON.');}return analyseRows(data);}
