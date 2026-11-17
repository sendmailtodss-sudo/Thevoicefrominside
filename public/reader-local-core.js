/* Private browser-local records. This module performs no storage or network I/O. */
(()=>{'use strict';
 const validPath=p=>typeof p==='string'&&/^\/(?:[a-z0-9-]+\/)*$/.test(p)&&p.length<=250;
 function validate(value,publicPaths=null){
  if(!value||typeof value!=='object'||Array.isArray(value)||value.format!=='sfi-reader-local'||value.version!==2||!Array.isArray(value.entries)||value.entries.length>250||Object.keys(value).some(k=>!['format','version','entries','exportedAt'].includes(k)))throw Error('invalid_backup');
  const seen=new Set(),entries=value.entries.map(r=>{
   if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['path','percent','note'].includes(k))||!validPath(r.path)||seen.has(r.path)||!((typeof r.percent==='number'&&Number.isFinite(r.percent)&&r.percent>=0&&r.percent<=100)||r.percent===null)||typeof r.note!=='string'||r.note.length>20000||(publicPaths&&!publicPaths.has(r.path)))throw Error('invalid_record');
   seen.add(r.path);return {path:r.path,percent:r.percent,note:r.note};
  });return {format:'sfi-reader-local',version:2,entries};
 }
 function merge(current,incoming){
  const a=validate(current),b=validate(incoming),map=new Map(a.entries.map(r=>[r.path,r]));
  for(const row of b.entries)map.set(row.path,row);
  if(map.size>250)throw Error('too_many_records');return validate({format:'sfi-reader-local',version:2,entries:[...map.values()]});
 }
 const api={validate,merge,validPath};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SFIReaderLocal=api;
})();
