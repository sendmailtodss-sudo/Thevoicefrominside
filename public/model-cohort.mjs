/** Shared identities for the landing sequence and shop. Availability is asset-backed. */
export const MODEL_COHORT = Object.freeze([
  Object.freeze({id:'hiphop-male', template:'male', style:'hiphop', label:{no:'Hiphop · herremodell',en:'Hip-hop · male model'}, image:'/design-assets/hiphop-male-blank.png', available:true}),
  Object.freeze({id:'hiphop-female', template:'female', style:'hiphop', label:{no:'Hiphop · kvinnemodell',en:'Hip-hop · female model'}, image:'/design-assets/hiphop-female-blank.png', available:true}),
  ...[
    ['hiphop-male','male','hiphop','Hiphop · herremodell','Hip-hop · male model'],
    ['punk-female','female','punk','Punk · kvinnemodell','Punk · female model'],
    ['kpop-male','male','k-pop','K-pop · herremodell','K-pop · male model'],
    ['workwear-female','female','workwear','Arbeidsklær · kvinnemodell','Workwear · female model'],
    ['business-male','male','business','Business · herremodell','Business · male model'],
    ['red-female','female','red','Rød · kvinnemodell','Red · female model'],
    ['orange-male','male','orange','Oransje · herremodell','Orange · male model'],
    ['hiphop-female','female','hiphop','Hiphop · kvinnemodell','Hip-hop · female model'],
  ].map(([id,template,style,no,en],atlasIndex)=>Object.freeze({id:'creator-'+id,template,style,label:{no:'Kreatør · '+no,en:'Creator · '+en},image:'/design-assets/creators-atlas-20261105.png',atlasIndex,available:true})),
]);
// All requested styles now have an atlas-backed preview.
export const PENDING_COHORT_STYLES = Object.freeze([]);
export const availableModels = () => MODEL_COHORT.filter(model => model.available);
export function resolveModel(value='male') {
  return MODEL_COHORT.find(model => model.id === value || model.template === value) || MODEL_COHORT[0];
}
