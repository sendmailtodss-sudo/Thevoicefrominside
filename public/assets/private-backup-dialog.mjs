/* Password entry is transient DOM only. No storage, logging or network. */
export function requestBackupPassword({language='nb',mode='encrypt'}={}){
 const en=language==='en',t=(no,eng)=>en?eng:no;
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='private-backup-dialog';dialog.setAttribute('aria-labelledby','private-backup-heading');
  const make=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const title=make('h2',mode==='encrypt'?t('Passordbeskyttet arbeidskopi','Password-protected work copy'):t('Åpne passordbeskyttet arbeidskopi','Open a password-protected work copy'));title.id='private-backup-heading';
  const note=make('p',t('Passordet brukes bare i denne nettleseren og sendes ikke. Glemt passord kan ikke gjenopprettes. En åpnet kopi finnes i fanens minne.','The password is used only in this browser and is not sent. A forgotten password cannot be recovered. An opened copy exists in the tab’s memory.'));
  const form=make('form');form.autocomplete='off';const label=make('label',t('Passord – minst 12 tegn','Password — at least 12 characters')),input=make('input');input.type='password';input.name='backupPassword';input.autocomplete=mode==='encrypt'?'new-password':'current-password';input.maxLength=2048;input.required=true;input.spellcheck=false;label.append(input);form.append(label);
  let repeat=null;if(mode==='encrypt'){const label2=make('label',t('Gjenta passordet','Repeat the password'));repeat=make('input');repeat.type='password';repeat.name='backupPasswordRepeat';repeat.autocomplete='new-password';repeat.maxLength=2048;repeat.required=true;repeat.spellcheck=false;label2.append(repeat);form.append(label2);}
  const error=make('p');error.setAttribute('role','alert');error.className='private-backup-error';const actions=make('div');actions.className='private-backup-actions';const confirm=make('button',mode==='encrypt'?t('Krypter og last ned','Encrypt and download'):t('Dekrypter og kontroller','Decrypt and validate'));confirm.type='submit';const cancel=make('button',t('Avbryt','Cancel'));cancel.type='button';actions.append(confirm,cancel);form.append(error,actions);dialog.append(title,note,form);document.body.append(dialog);
  const previous=document.activeElement;let settled=false;const finish=value=>{if(settled)return;settled=true;input.value='';if(repeat)repeat.value='';dialog.close();dialog.remove();if(previous?.isConnected)previous.focus();resolve(value);};
  cancel.onclick=()=>finish(null);dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});dialog.addEventListener('close',()=>{if(!settled)finish(null);});
  form.addEventListener('submit',event=>{event.preventDefault();const count=Array.from(input.value).length;if(count<12||count>1024){error.textContent=t('Bruk 12–1024 tegn i passordet.','Use 12–1024 characters for the password.');return;}if(repeat&&repeat.value!==input.value){error.textContent=t('Passordene er ikke like.','The passwords do not match.');return;}finish(input.value);});
  dialog.showModal();input.focus();
 });
}
