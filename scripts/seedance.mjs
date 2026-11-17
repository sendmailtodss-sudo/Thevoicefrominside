#!/usr/bin/env node
// BytePlus Seedance 2.5 CLI. No SDK or external dependencies.
// Submitting a task may incur charges and requires an explicit flag.
import { parseArgs } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const API_ORIGIN = 'https://ark.ap-southeast.bytepluses.com';
export const MODEL = 'dreamina-seedance-2-5-260628';
const TASKS_PATH = '/api/v3/contents/generations/tasks';

export function buildTask(prompt, { duration = 5, ratio = '16:9', resolution = '720p', draft = false } = {}) {
  if (!prompt || !prompt.trim()) throw new Error('Prompt is required');
  if (!Number.isInteger(duration) || duration < 2 || duration > 30) throw new Error('Duration must be 2-30 seconds');
  if (!['16:9', '9:16', '1:1', '4:3', '3:4', 'adaptive'].includes(ratio)) throw new Error('Unsupported ratio');
  if (!['480p', '720p', '1080p'].includes(resolution)) throw new Error('Unsupported resolution');
  if (draft && resolution !== '480p') throw new Error('Draft mode requires 480p');
  return { model: process.env.ARK_MODEL_ID || MODEL, content: [{type:'text', text:prompt.trim()}], duration, ratio, resolution, ...(draft ? {draft:true} : {}) };
}

export async function arkRequest(path, { method = 'GET', body, key = process.env.ARK_API_KEY, fetchFn = fetch } = {}) {
  if (!key) throw new Error('Missing ARK_API_KEY secret (do not commit the key)');
  const response = await fetchFn(API_ORIGIN + path, {
    method, headers: {Authorization: 'Bearer ' + key, 'Content-Type': 'application/json'},
    ...(body ? {body: JSON.stringify(body)} : {}),
  });
  const raw = await response.text();
  let data;
  try {data = JSON.parse(raw)} catch {throw new Error('ModelArk returned a non-JSON response (HTTP ' + response.status + ')')}
  if (!response.ok) throw new Error('ModelArk HTTP ' + response.status + ': ' + JSON.stringify(data));
  return data;
}

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  const {values} = parseArgs({args:rest, options:{
    prompt:{type:'string'}, seconds:{type:'string'}, ratio:{type:'string'}, resolution:{type:'string'},
    draft:{type:'boolean'}, id:{type:'string'}, output:{type:'string'},
    'confirm-paid':{type:'boolean'},
  }, strict:true});
  if (command === 'prepare' || command === 'submit') {
    const body = buildTask(values.prompt, {
      duration: values.seconds === undefined ? 5 : Number(values.seconds),
      ratio: values.ratio || '16:9', resolution: values.resolution || (values.draft ? '480p' : '720p'),
      draft: Boolean(values.draft),
    });
    if (command === 'prepare') { console.log(JSON.stringify({warning:'PREVIEW ONLY — no API request or charge',request:body}, null, 2)); return; }
    if (!values['confirm-paid']) throw new Error('Paid submission blocked. Pass --confirm-paid after reviewing cost.');
    console.log(JSON.stringify(await arkRequest(TASKS_PATH, {method:'POST',body}), null, 2)); return;
  }
  if (command === 'status') {
    if (!values.id || !/^[a-zA-Z0-9_-]+$/.test(values.id)) throw new Error('Valid --id required');
    console.log(JSON.stringify(await arkRequest(TASKS_PATH + '/' + encodeURIComponent(values.id)), null, 2)); return;
  }
  if (command === 'download') {
    if (!values.id || !/^[a-zA-Z0-9_-]+$/.test(values.id) || !values.output) throw new Error('--id and --output are required');
    const task = await arkRequest(TASKS_PATH + '/' + encodeURIComponent(values.id));
    if (task.status !== 'succeeded' || !task.content?.video_url) throw new Error('Video not ready');
    const url = new URL(task.content.video_url);
    if (url.protocol !== 'https:') throw new Error('Refusing non-HTTPS video URL');
    const response = await fetch(url, {redirect:'follow'});
    if (!response.ok) throw new Error('Video download failed: HTTP ' + response.status);
    const output = resolve(values.output);
    await mkdir(dirname(output), {recursive:true});
    await writeFile(output, Buffer.from(await response.arrayBuffer()));
    console.log('Saved ' + output); return;
  }
  throw new Error('Usage: node scripts/seedance.mjs prepare|submit --prompt "..." [--seconds 5] [--draft] [--confirm-paid]; status --id ID; download --id ID --output path.mp4');
}

if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  main().catch(e => {console.error(e.message); process.exitCode = 1;});
}
