import {mediaType} from './media.mjs';
const el = id => document.getElementById(id);
const status = message => { el('status').textContent = message; };
const request = indexedDB.open('voice-from-inside-dreamina', 1);
request.onupgradeneeded = () => request.result.createObjectStore('media', {keyPath:'id'});
function display({blob, name, prompt}) {
  const figure = document.createElement('figure');
  const video = blob.type === 'video/mp4';
  const media = document.createElement(video ? 'video' : 'img');
  media.style.maxWidth = '100%';
  if (video) media.controls = true;
  else media.alt = name;
  media.src = URL.createObjectURL(blob);
  const caption = document.createElement('figcaption');
  caption.textContent = [name,prompt].filter(Boolean).join(' — ');
  const link = document.createElement('a');
  link.href = media.src;
  link.download = name;
  link.textContent = 'Last ned filen';
  figure.append(media, caption, link);
  el('gallery').prepend(figure);
}
el('export').onclick = () => {
  const prompt = el('prompt').value.trim();
  if (!prompt) return status('Skriv en prompt først.');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([prompt], {type:'text/plain;charset=utf-8'}));
  link.download = 'dreamina-prompt.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
  status('Prompt eksportert.');
};
el('file').disabled = true;
request.onerror = () => status('Nettleseren kunne ikke åpne lokal lagring.');
request.onsuccess = () => {
  const db = request.result;
  const rows = db.transaction('media').objectStore('media').openCursor();
  rows.onerror = () => status('Kunne ikke lese lagrede filer.');
  rows.onsuccess = () => {
    const cursor = rows.result;
    if (cursor) { display(cursor.value); cursor.continue(); }
    else el('file').disabled = false;
  };
  el('file').onchange = async () => {
    const file = el('file').files[0];
    if (!file) return;
    try {
      const type = await mediaType(file);
      const blob = file.slice(0, file.size, type);
      const url = URL.createObjectURL(blob);
      try {
        if (type.startsWith('image/')) (await createImageBitmap(blob)).close();
        else await new Promise((resolve,reject) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => video.videoWidth ? resolve() : reject();
          video.onerror = reject;
          video.src = url;
        });
      } catch { throw Error('Nettleseren kunne ikke lese mediefilen.'); }
      finally { URL.revokeObjectURL(url); }
      const record = {id:crypto.randomUUID(),name:file.name,prompt:el('prompt').value.trim(),blob};
      const tx = db.transaction('media','readwrite');
      tx.objectStore('media').add(record);
      tx.oncomplete = () => { display(record); status('Fil lagret i dette verkstedet.'); };
      tx.onabort = () => status('Lagring feilet. Kontroller ledig nettleserplass.');
    } catch (error) { status(error.message); }
    el('file').value = '';
  };
};
