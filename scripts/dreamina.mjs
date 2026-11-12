// Private operator terminal only. The contributor HTTP preview never invokes the CLI.
import {spawnSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export function command(action, value, submitId, config = process.env) {
  if (!uuid.test(config.DREAMINA_PROJECT_ID || '')) throw Error('Configure DREAMINA_PROJECT_ID with the project canvas UUID.');
  const project = '--project-id=' + config.DREAMINA_PROJECT_ID;
  if (['image','video','plan-image','plan-video','draft-image','draft-video'].includes(action)) {
    const kind = action.endsWith('image') ? 'image' : 'video';
    const model = config['DREAMINA_' + kind.toUpperCase() + '_MODEL'];
    if (!model) throw Error('Configure the model from dreamina-canvas model list --type ' + kind);
    if (!value?.trim() || value.length > 7000) throw Error('Supply a prompt of 1–7000 characters.');
    const args = ['node','create',kind, project,'--mode=' + (kind === 'image' ? 't2i' : 't2v'),
      '--model=' + model,'--prompt=' + value,'--title=The Voice From Inside',
      '--ratio=' + (config.DREAMINA_RATIO || '16:9'),
      '--resolution=' + (config['DREAMINA_' + kind.toUpperCase() + '_RESOLUTION'] || (kind === 'image' ? '1K' : '720P'))];
    if (action.startsWith('plan-')) return [...args,'--dry-run'];
    if (action.startsWith('draft-')) return args;
    if (!uuid.test(submitId || '')) throw Error('Provide a stable submission UUID and keep it for recovery.');
    return [...args,'--run','--submit-id=' + submitId];
  }
  if (action === 'status' && uuid.test(value || '')) return ['operation','status',value,project];
  if (action === 'download' && /^[a-zA-Z0-9_-]{1,160}$/.test(value || '')) {
    const dir = fileURLToPath(new URL('../local-data/dreamina/' + config.DREAMINA_PROJECT_ID + '/', import.meta.url));
    mkdirSync(dir, {recursive:true,mode:0o700});
    return ['resource','download',value,project,'--output=' + dir + value + '.media'];
  }
  throw Error('Expected image/video PROMPT UUID, status SUBMISSION_UUID or download RESOURCE_ID.');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = command(...process.argv.slice(2));
    const run = spawnSync(process.env.DREAMINA_BIN || 'dreamina-canvas', args,
      {stdio:'inherit',timeout:120000,killSignal:'SIGKILL'});
    if (run.error?.code === 'ENOENT') throw Error('Install the official Dreamina Canvas CLI and run its auth login command.');
    if (run.error || run.status !== 0) throw Error('Dreamina did not confirm success. Check the CLI diagnostic and query status before submitting again.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
