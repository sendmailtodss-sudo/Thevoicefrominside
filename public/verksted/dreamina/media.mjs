export const limit = 50 * 1024 * 1024;
export async function mediaType(file) {
  if (!file.size || file.size > limit) throw Error('Filen er tom eller større enn 50 MiB.');
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if ([137,80,78,71,13,10,26,10].every((value,i) => bytes[i] === value)) return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  const header = String.fromCharCode(...bytes);
  if (header.slice(4,8) === 'ftyp' && /^(isom|iso[2-6]|mp4[12]|avc1|M4V )$/.test(header.slice(8,12))) return 'video/mp4';
  throw Error('Filinnholdet må være PNG, JPEG eller MP4.');
}
