import {singleArtworkDesign} from './merch-designer-core.mjs';
import {createShirtSvg,shirtPreviewPng,printArtist,printTitle} from './merch-shirt-preview.mjs';
const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;};
export function mountPrintPreviews({mount,before,getArtworks,getDesign,language='no',onSelect}){
 const t=(no,en)=>language==='en'?en:no,artist=a=>printArtist(a)||t('Kunstner ikke oppgitt','Artist not listed');
 let chosen=null,limit=12,filterKey='',active=null,opener=null;
 const element=node('section','print-previews');element.id='print-previews';
 const heading=node('h2','',t('Se kunsten på T-skjorten','See the art on a T-shirt'));heading.id='print-previews-heading';element.setAttribute('aria-labelledby',heading.id);
 const intro=node('p','',t('Velg kunstnere og se hvert motiv på en hvit T-skjorte. Åpne et motiv for å se begge sider og laste ned bildet.','Choose artists and see each artwork on a white T-shirt. Open an artwork to see both sides and download the image.'));
 const filters=node('details','print-artist-picker'),summary=node('summary','',t('Velg kunstnere','Choose artists')),fieldset=node('fieldset');fieldset.id='print-artist-filters';fieldset.append(node('legend','',t('Vis motiver fra','Show artworks by')));
 const options=node('div','print-artist-options'),all=node('button','secondary print-artists-all',t('Vis alle kunstnere','Show all artists'));all.type='button';
 fieldset.append(options,all);filters.append(summary,fieldset);
 const count=node('p','print-preview-count');count.setAttribute('role','status');const grid=node('div','print-preview-grid'),more=node('button','secondary print-previews-more',t('Vis flere motiver','Show more artworks'));more.type='button';
 element.append(heading,intro,filters,count,grid,more,node('p','small-note',t('Plasseringsforslag. Endelig størrelse, trykkfarger og materiale avklares i produsentens korrektur.','Placement proposals. Final dimensions, print colours and material are confirmed in the maker’s proof.')));
 mount.insertBefore(element,before||null);
 const dialog=node('dialog','print-preview-dialog');dialog.id='print-preview-dialog';dialog.setAttribute('aria-labelledby','print-preview-title');
 const top=node('div','print-preview-dialog-top'),title=node('h2','print-preview-title');title.id='print-preview-title';const close=node('button','secondary print-preview-close',t('Lukk','Close'));close.type='button';top.append(title,close);
 const byline=node('p','print-preview-byline'),models=node('div','hiphop-model-grid print-preview-models'),sides=node('div','print-preview-sides'),label=node('p','print-preview-label'),actions=node('div','designer-actions'),choose=node('button','primary-full print-preview-select',t('Velg dette motivet','Choose this artwork')),download=node('button','secondary print-preview-download',t('Last ned begge sider · PNG','Download both sides · PNG')),status=node('p','message');choose.type=download.type='button';status.setAttribute('role','status');
 actions.append(choose,download);dialog.append(top,byline,models,sides,label,node('p','small-note',t('Flat plasseringsskisse med originalfil · ikke en produksjonskorrektur eller bestilling','Flat placement sketch with the original file · not a production proof or order')),actions,status);document.body.append(dialog);
 const artworkDesign=id=>singleArtworkDesign(id,{size:getDesign().size,brandingPlacement:getDesign().branding.placement});
 const closeDialog=()=>{dialog.close();if(opener?.isConnected)opener.focus();};close.addEventListener('click',closeDialog);
 dialog.addEventListener('cancel',event=>{event.preventDefault();closeDialog();});dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog();});
 function open(id,button){
  const a=getArtworks().find(a=>a.id===id);if(!a)return;active={id,design:artworkDesign(id)};opener=button;title.textContent=printTitle(a,language);byline.textContent=artist(a);status.textContent='';sides.replaceChildren();
  for(const side of ['front','back']){const figure=node('figure'),caption=node('figcaption','',side==='front'?t('Forside','Front'):t('Rygg','Back')),image=createShirtSvg({design:active.design,artworks:getArtworks(),side,language});image.classList.add('print-preview-'+side);figure.append(image,caption);sides.append(figure);}
  models.replaceChildren();
  label.textContent=active.design.branding.placement==='inside_label'?t('Innvendig merkelapp: Stemmen fra innsiden. Ingen utvendig fellesskapsmerking.','Inside label: Stemmen fra innsiden. No exterior community mark.'):t('Stemmen fra innsiden-merket står synlig nederst på forsiden.','The Stemmen fra innsiden mark is visible at the front hem.');
  dialog.showModal();close.focus();
 }
 choose.addEventListener('click',()=>{if(!active)return;const id=active.id;closeDialog();onSelect(id);});
 download.addEventListener('click',async()=>{
  if(!active||download.disabled)return;const snapshot=active;download.disabled=true;status.textContent=t('Lager forhåndsvisning …','Preparing preview …');
  try{const blob=await shirtPreviewPng({design:snapshot.design,artworks:getArtworks(),language}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='stemmen-tshirt-'+snapshot.id+'-begge-sider.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status.textContent=t('Begge sider er lastet ned.','Both sides downloaded.');}catch{status.textContent=t('Motivbildet kunne ikke hentes. Prøv igjen når bildet er tilgjengelig.','The artwork image could not be loaded. Try again when it is available.');}finally{download.disabled=false;}
 });
 function refresh(){
  const artworks=getArtworks(),artists=[...new Set(artworks.map(artist))],key=JSON.stringify(artists);
  if(key!==filterKey){filterKey=key;options.replaceChildren();for(const name of artists){const label=node('label','print-artist-option'),input=node('input');input.type='checkbox';input.dataset.artistName=name;input.addEventListener('change',()=>{chosen=new Set([...options.querySelectorAll('input:checked')].map(i=>i.dataset.artistName));limit=12;refresh();});label.append(input,node('span','',name));options.append(label);}}
  for(const input of options.querySelectorAll('input'))input.checked=chosen===null||chosen.has(input.dataset.artistName);
  const shown=artworks.filter(a=>chosen===null||chosen.has(artist(a)));grid.replaceChildren();
  for(const a of shown.slice(0,limit)){
   const card=node('article','print-preview-card');card.dataset.artworkId=a.id;const button=node('button','print-preview-open');button.type='button';button.setAttribute('aria-label',t('Se på T-skjorte: ','View on T-shirt: ')+printTitle(a,language)+' · '+artist(a));button.append(createShirtSvg({design:artworkDesign(a.id),artworks,language,side:'back'}));button.append(node('span','print-preview-open-label',t('Se begge sider','View both sides')));button.addEventListener('click',()=>open(a.id,button));card.append(button,node('h3','print-preview-artwork',printTitle(a,language)),node('p','print-preview-artist',artist(a)));grid.append(card);
  }
  count.textContent=shown.length?t(`Viser ${Math.min(limit,shown.length)} av ${shown.length} motiver.`, `Showing ${Math.min(limit,shown.length)} of ${shown.length} artworks.`):t('Ingen motiver for de valgte kunstnerne. Velg en kunstner over.','No artworks for the selected artists. Choose an artist above.');more.hidden=shown.length<=limit;
 }
 all.addEventListener('click',()=>{chosen=null;limit=12;refresh();});more.addEventListener('click',()=>{limit+=12;refresh();});refresh();
 return {element,refresh};
}
