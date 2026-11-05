export const WITNESS_KINDS=Object.freeze(['forced_undressing','security_cell','suspected_substance_use','other']);
export const WITNESS_INSTITUTIONS=Object.freeze(['bergen','bjorgvin','lyderhorn','region_vest','kdi','other']);
export const WITNESS_ROLES=Object.freeze(['legal_staff','management','prison_officer','health_staff','other']);
export const PRIVATE_FIELDS=Object.freeze(['kind','institution','yearFrom','yearTo','role','claim','sourceReference','quote','confirms','doesNotConfirm','aiFlag','consentPrivate','requestPublic']);
export const PUBLIC_FIELDS=Object.freeze(['kind','institution','yearFrom','yearTo','role','summary','confirms','doesNotConfirm']);
export const CONSENT_VERSION='witness-2026-11-02-v1';
export const MIN_GROUP=5;
const bad=message=>{throw new Error(message);};
export function exactShape(value,fields){if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).length!==fields.length||fields.some(k=>!Object.hasOwn(value,k)))bad('Unexpected or missing fields.');}
function text(value,min,max){if(typeof value!=='string')bad('Text is required.');const result=value.trim();if(result.length<min||result.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result))bad('Invalid text length or characters.');return result;}
function coarse(v,year){if(!WITNESS_KINDS.includes(v.kind)||!WITNESS_INSTITUTIONS.includes(v.institution)||!WITNESS_ROLES.includes(v.role))bad('Use the listed categories.');if(!Number.isInteger(v.yearFrom)||!Number.isInteger(v.yearTo)||v.yearFrom<1980||v.yearTo>year||v.yearTo<v.yearFrom||v.yearTo-v.yearFrom>10)bad('Use a valid broad year period.');return {kind:v.kind,institution:v.institution,yearFrom:v.yearFrom,yearTo:v.yearTo,role:v.role};}
export function validatePrivateSelection(v,year=new Date().getUTCFullYear()){
 exactShape(v,PRIVATE_FIELDS);if(v.consentPrivate!==true||typeof v.requestPublic!=='boolean'||typeof v.aiFlag!=='boolean')bad('Separate explicit private processing consent is required.');
 return {...coarse(v,year),claim:text(v.claim,20,2400),sourceReference:text(v.sourceReference,3,500),quote:text(v.quote,10,2000),confirms:text(v.confirms,10,1500),doesNotConfirm:text(v.doesNotConfirm,10,1500),aiFlag:v.aiFlag,consentPrivate:true,requestPublic:v.requestPublic};
}
export function validateImportedWitnessDraft(v,year=new Date().getUTCFullYear()){
 exactShape(v,PRIVATE_FIELDS);if(typeof v.aiFlag!=='boolean'||typeof v.consentPrivate!=='boolean'||typeof v.requestPublic!=='boolean')bad('Draft checkbox values must be booleans.');
 return {...coarse(v,year),claim:text(v.claim,0,2400),sourceReference:text(v.sourceReference,0,500),quote:text(v.quote,0,2000),confirms:text(v.confirms,0,1500),doesNotConfirm:text(v.doesNotConfirm,0,1500),aiFlag:v.aiFlag,consentPrivate:false,requestPublic:false};
}
// This catches obvious identifiers, not every possible identifying combination.
// A trained reviewer must still check every release and the author approves that exact release.
export function obviousIdentifiers(v){return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|\b\d{8,11}\b|\b(?:innsattnummer|innsattnr|prisoner\s*(?:id|number)|fødselsnummer|personnummer)\b|\b\d{4,6}[-/]\d{1,4}\b/i.test(v);}
export function validatePublicSummary(v,year=new Date().getUTCFullYear()){
 exactShape(v,PUBLIC_FIELDS);const out={...coarse(v,year),summary:text(v.summary,20,1000),confirms:text(v.confirms,15,1000),doesNotConfirm:text(v.doesNotConfirm,15,1000)};
 if(obviousIdentifiers([out.summary,out.confirms,out.doesNotConfirm].join(' ')))bad('Remove contact details, URLs and identifying numbers from public text.');return out;
}
export function publicDraftFromSelection(v){const p=validatePrivateSelection(v);return {kind:p.kind,institution:p.institution,yearFrom:p.yearFrom,yearTo:p.yearTo,role:p.role,summary:p.claim,confirms:p.confirms,doesNotConfirm:p.doesNotConfirm};}
export function syntheticWitness(){return {kind:'security_cell',institution:'other',yearFrom:2025,yearTo:2025,role:'management',claim:'SYNTETISK EKSEMPEL: Jeg opplevde at begrunnelsen ikke vurderte et mindre inngripende alternativ.',sourceReference:'SYNTETISK VEDTAK, side 1, avsnitt 2',quote:'SYNTETISK SITAT: Plassering besluttes for å avverge skade. Ny vurdering skal foretas.',confirms:'Eksempelteksten beskriver en beslutning om plassering og at ny vurdering skal foretas.',doesNotConfirm:'Eksempelet bekrefter ikke om vilkårene var oppfylt, hva som faktisk skjedde eller om noen brøt loven.',aiFlag:true,consentPrivate:true,requestPublic:false};}
