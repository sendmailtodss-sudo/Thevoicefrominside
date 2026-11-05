(function(){'use strict';
const form=document.querySelector('#testimony-form');if(!form)return;
const en=document.documentElement.lang.startsWith('en'),t=(no,english)=>en?english:no;
const output=document.querySelector('#testimony-output'),status=document.querySelector('#testimony-status'),download=document.querySelector('#testimony-download');let unsaved=false;
function invalidate(){unsaved=true;output.textContent='';output.hidden=true;download.disabled=true;status.textContent=t('Teksten er endret. Lag et nytt utkast før nedlasting. Ingenting er sendt.','The text has changed. Create a new draft before downloading. Nothing has been sent.');}
form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);
form.addEventListener('submit',event=>{event.preventDefault();if(!form.checkValidity()){form.reportValidity();return;}
 const data=Object.fromEntries(new FormData(form));
 const text=[t('PRIVAT UTKAST TIL MODERERING – IKKE PUBLISERT','PRIVATE DRAFT FOR REVIEW — NOT PUBLISHED'),t('Visningsnavn: ','Display name: ')+data.alias,t('Institusjon/område: ','Institution/area: ')+data.institution,t('Periode: ','Period: ')+data.period,'',data.story,'',t('Spørsmål jeg ber om svar på:','Questions I want answered:'),data.question,'',t('Dokumentstatus: ','Document status: ')+data.evidence,'',t('Kontroller navn, innsattnummer, saksnummer, helseopplysninger og gjenkjennelige detaljer før en eventuell innsending. Ingen automatisk anonymisering er utført.','Review names, prisoner numbers, case numbers, health information and identifying details before any submission. No automatic anonymisation has been performed.')].join('\n');
 output.textContent=text;output.hidden=false;unsaved=true;
 const risky=/\b\d{6,11}\b|\b\d{4}-\d{2}\b|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|https?:\/\//i.test(Object.values(data).join(' '));
 status.textContent=risky?t('Utkast laget. Teksten inneholder tall, kontaktopplysninger eller lenker som kan identifisere noen. Kontroller manuelt. Ingenting er sendt.','Draft created. Numbers, contact information or links may identify someone. Review them manually. Nothing has been sent.'):t('Utkast laget lokalt. Det kan fortsatt inneholde gjenkjennelige opplysninger; manuell gjennomgang er nødvendig. Ingenting er sendt.','Draft created locally. It may still contain identifying information and requires manual review. Nothing has been sent.');download.disabled=false;
});
download.addEventListener('click',()=>{if(download.disabled||!output.textContent)return;const url=URL.createObjectURL(new Blob([output.textContent],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=en?'private-testimony-draft.txt':'privat-vitnesbyrd-utkast.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);unsaved=false;});
document.querySelector('#testimony-clear').addEventListener('click',()=>{form.reset();output.textContent='';output.hidden=true;download.disabled=true;unsaved=false;status.textContent=t('Feltene er tømt. En fil du selv lastet ned må eventuelt slettes av deg.','The fields are cleared. Any downloaded file must be deleted by you separately.');});
window.addEventListener('beforeunload',event=>{if(unsaved){event.preventDefault();event.returnValue='';}});
})();
