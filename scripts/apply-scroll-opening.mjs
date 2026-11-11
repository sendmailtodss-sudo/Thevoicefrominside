import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Bounded template migration: preserve every byte outside the explicitly named
// opening/header blocks. It is also usable on the separately managed full text.
export function applyScrollOpening(html) {
  const begin='<!-- public-entrances-start -->',end='<!-- public-entrances-end -->';
  if(html.includes(begin)){
    const a=html.indexOf(begin),b=html.indexOf(end,a);
    if(b<0||html.indexOf(begin,a+begin.length)>=0)throw Error('Conflicting entrance anchors');
    const block=html.slice(a,b+end.length).replace('class="home-entrances"','id="home-entrances" class="home-entrances"').replace('id="home-entrances" id="home-entrances"','id="home-entrances"');
    html=html.slice(0,a)+html.slice(b+end.length);
    const anchor='<!-- minds-landing-end -->';
    if(!html.includes(anchor))throw Error('Missing end of the visual opening');
    html=html.replace(anchor,anchor+block);
  }
  html=html.replace('class="sj" id="journey"','class="sj" id="journey" data-origin="true"');
  html=html.replace('data-origin="true" data-origin="true"','data-origin="true"');
  html=html.replace('src="/assets/journey/galaxy.webp" alt="" width="1280"','src="/assets/journey/origin.svg" alt="" width="1280"');
  html=html.replace('<option value="zh">中文</option>','<option value="zh-Hans">简体中文</option>');
  if(html.includes('id="home-entrances"'))html=html.replace('href="#minds-gallery" data-sj-text="skip"','href="#home-entrances" data-sj-text="skip"');
  return html;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  for(const file of process.argv.slice(2)){const before=await readFile(file,'utf8'),after=applyScrollOpening(before);await writeFile(file,after)}
}
