#!/usr/bin/env python3
"""Produce auditable video evidence. Never generates semantic visual claims."""
from __future__ import annotations
import argparse, datetime as dt, hashlib, importlib.metadata, ipaddress, json, math, re, shutil, socket, subprocess, sys
from pathlib import Path
from urllib.parse import parse_qs, urlsplit, unquote

YTDLP_PIN = '2026.10.26'
MAX_FRAMES = 64
MAX_SOURCE_BYTES = 512 * 1024 * 1024
MAX_DURATION = 7200
class EvidenceError(Exception):
    def __init__(self, code, message): self.code, self.message = code, message; super().__init__(message)
def utc(): return dt.datetime.now(dt.timezone.utc).isoformat()
def sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()
def write_json(path, data):
    path=Path(path);temporary=path.with_name('.'+path.name+'.tmp')
    temporary.write_text(json.dumps(data,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8');temporary.replace(path)
def parse_time(value):
    text=str(value).strip()
    if not re.fullmatch(r'\d+(?::\d{1,2}){0,2}(?:\.\d+)?', text):
        raise EvidenceError('invalid_timestamp','Use nonnegative seconds, MM:SS or HH:MM:SS with optional decimal seconds.')
    parts=[float(x) for x in text.split(':')]
    if len(parts)>1 and (parts[-1]>=60 or (len(parts)==3 and parts[-2]>=60)):
        raise EvidenceError('invalid_timestamp','Clock minute/second fields must be below 60.')
    result=sum(x*(60**i) for i,x in enumerate(reversed(parts)))
    if not math.isfinite(result): raise EvidenceError('invalid_timestamp','Timestamp must be finite.')
    return result
def timecode(seconds):
    ms=round(seconds*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
    return f'{h:02d}:{m:02d}:{s:02d}.{ms:03d}'
def redact(value):
    # Conservative by design: partial Authorization/Cookie/JSON scrubbing can
    # leave a second secret behind. Never persist any part of a sensitive line.
    lines=[]
    for line in str(value).splitlines():
        if re.search(r'(?i)authorization|cookie|token|signature|password|(?<![a-z])sig(?![a-z])',line):
            lines.append('[redacted sensitive diagnostic line]')
        else: lines.append(re.sub(r'https?://[^\s<>\"\']+', '[redacted URL]', line))
    return '\n'.join(lines)[:500]

def public_reference(url):
    u=urlsplit(url)
    if u.scheme!='https' or not u.hostname or u.username or u.password:
        raise EvidenceError('unsupported_url','Only public HTTPS pages/media without embedded credentials are supported.')
    host=unquote(u.hostname).rstrip('.').lower()
    try: host=host.encode('idna').decode('ascii');port=u.port
    except (ValueError,UnicodeError): raise EvidenceError('unsupported_url','The HTTPS host or port is invalid.')
    if host=='localhost' or host.endswith(('.localhost','.local','.internal','.lan','.home')) or any(ord(c)<33 for c in host):
        raise EvidenceError('nonpublic_url','Use an authorized local file for local/internal sources.')
    address=None
    try:address=ipaddress.ip_address(host)
    except ValueError:
        try:address=ipaddress.ip_address(socket.inet_aton(host))
        except OSError:pass
    if address is not None and (not address.is_global or address.is_multicast or address.is_reserved):
        raise EvidenceError('nonpublic_url','Private/reserved IP sources are not accepted.')
    if address is None and '.' not in host:raise EvidenceError('nonpublic_url','Local/bare hostnames are not accepted.')
    video_id=None
    if host in ('youtube.com','www.youtube.com','m.youtube.com','music.youtube.com'):
        if u.path.rstrip('/')=='/watch':
            values=parse_qs(u.query).get('v',[]);video_id=values[0] if len(values)==1 else None
        elif re.fullmatch(r'/(shorts|embed)/[A-Za-z0-9_-]{11}/?',u.path):video_id=u.path.strip('/').split('/')[1]
        if not video_id or not re.fullmatch(r'[A-Za-z0-9_-]{11}',video_id):
            raise EvidenceError('single_video_required','Supply an exact YouTube watch, shorts or embed video URL.')
    elif host=='youtu.be':
        video_id=u.path.strip('/')
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}',video_id):raise EvidenceError('single_video_required','Supply an exact short YouTube video URL.')
    if video_id:return {'kind':'public_page','canonical_url':'https://www.youtube.com/watch?v='+video_id,'video_id':video_id}
    # Generic extractors/direct media may have signed query OR path components.
    return {'kind':'public_url','origin':u.scheme+'://'+u.netloc,'url_sha256':hashlib.sha256(url.encode()).hexdigest(),'full_url_logged':False}
def run(argv, timeout=180):
    try: result=subprocess.run(argv,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout,check=False)
    except FileNotFoundError: raise EvidenceError('missing_tool',Path(argv[0]).name+' is not installed.')
    except subprocess.TimeoutExpired: raise EvidenceError('tool_timeout',Path(argv[0]).name+' exceeded its bounded runtime.')
    if result.returncode: raise EvidenceError('tool_failed',Path(argv[0]).name+f' failed (exit {result.returncode}); raw diagnostics were not logged.')
    return result

def probe(source):
    source=Path(source).expanduser().resolve()
    if not source.is_file(): raise EvidenceError('source_missing','The local source is not a regular file.')
    raw=json.loads(run(['ffprobe','-v','error','-show_entries','format=format_name,duration,start_time,size:stream=index,codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,start_time,duration','-of','json',str(source)],60).stdout)
    videos=[s for s in raw.get('streams',[]) if s.get('codec_type')=='video']
    if not videos: raise EvidenceError('no_video','The source has no decodable video stream.')
    try:
        duration=float(raw['format']['duration'])
        stream_duration=videos[0].get('duration')
        if stream_duration is not None:
            duration=float(stream_duration)+max(0,float(videos[0].get('start_time',0))-float(raw['format'].get('start_time',0)))
    except (KeyError,ValueError,TypeError): raise EvidenceError('unknown_duration','A finite source duration is required.')
    if not math.isfinite(duration) or duration<=0 or duration>MAX_DURATION:
        raise EvidenceError('duration_limit',f'Use a positive finite video no longer than {MAX_DURATION} seconds.')
    return {'basename':source.name,'sha256':sha(source),'bytes':source.stat().st_size,'duration_seconds':duration,
            'time_origin':'Seconds relative to container start; ffmpeg copyts/start_at_zero preserves source-frame timing.',
            'format':raw.get('format',{}),'streams':raw.get('streams',[])}
def prepare(out):
    out=Path(out).expanduser().resolve()
    if out.exists() and any(out.iterdir()): raise EvidenceError('output_not_empty','Use a new empty output directory; existing evidence is never overwritten.')
    out.mkdir(parents=True,exist_ok=True,mode=0o700);out.chmod(0o700);return out

def targets(centres, duration, window, step):
    if not math.isfinite(window) or window<0 or window>5 or not math.isfinite(step) or step<=0 or step>5:
        raise EvidenceError('invalid_sampling','Window must be 0–5 seconds and step positive, at most 5 seconds.')
    if len(centres)>MAX_FRAMES or (window and step<window/MAX_FRAMES):
        raise EvidenceError('frame_limit',f'At most {MAX_FRAMES} bounded frame samples per run.')
    desired=set()
    for centre in centres:
        if centre<0 or centre>=duration: raise EvidenceError('timestamp_out_of_range','Every requested timestamp must be within the source duration.')
        desired.add(round(centre,6))
        if window:
            count=math.ceil(window/step)
            for i in range(-count,count+1):
                offset=i*step
                if abs(offset)<=window+1e-9:
                    desired.add(round(max(0,min(duration-.000001,centre+offset)),6))
    if len(desired)>MAX_FRAMES: raise EvidenceError('frame_limit',f'At most {MAX_FRAMES} frames per run; reduce centres/window or increase step.')
    return sorted(desired)
def artifact(path, kind, **fields):
    return {'file':Path(path).name,'kind':kind,'sha256':sha(path),'bytes':Path(path).stat().st_size,
            'inspection':{'status':'not_inspected','attestations':[]},**fields}
def extract_frame(source, out, requested, number, width):
    dest=out/f'frame-{number:03d}.png'
    vf=f'scale=min({width}\\,iw):-2,showinfo'
    # Accurate input seeking discards to requested time; preserving timestamps
    # avoids falsely labeling the nearest frame as the exact requested instant.
    cmd=['ffmpeg','-hide_banner','-loglevel','info','-nostdin','-ss',f'{requested:.6f}',
         '-copyts','-start_at_zero','-i',str(source),'-map','0:v:0','-vf',vf,
         '-frames:v','1','-fps_mode','vfr','-threads','2',str(dest)]
    r=run(cmd)
    pts=re.findall(r'Parsed_showinfo[^\n]*\bn:\s*\d+\s+pts:[^\n]*?pts_time:([0-9.+eE-]+)',r.stderr)
    selection='first decoded frame at/after requested time; actual PTS recorded'
    if not pts or not dest.is_file():
        # A request inside the final frame's display interval has no later frame.
        # Decode the bounded tail and retain its actual final PTS, without
        # pretending that a nonexistent exact-timestamp frame was produced.
        meta=probe(source);tail=max(0,meta['duration_seconds']-2)
        fallback=['ffmpeg','-hide_banner','-loglevel','info','-nostdin','-y','-ss',f'{tail:.6f}',
                  '-copyts','-start_at_zero','-i',str(source),'-map','0:v:0','-vf',vf,
                  '-fps_mode','vfr','-update','1','-threads','2',str(dest)]
        r=run(fallback);pts=re.findall(r'Parsed_showinfo[^\n]*\bn:\s*\d+\s+pts:[^\n]*?pts_time:([0-9.+eE-]+)',r.stderr)
        selection='final available source frame; requested timestamp is in the video tail'
        actual=float(pts[-1]) if pts else float('nan')
    else: actual=float(pts[0])
    if not math.isfinite(actual) or actual<0 or not dest.is_file():
        raise EvidenceError('frame_timestamp_missing','A decoded frame with a valid source timestamp was not produced.')
    return artifact(dest,'decoded_frame',requested_seconds=requested,actual_seconds=actual,actual_timecode=timecode(actual),selection=selection)

def contact_sheet(out, frames):
    try: from PIL import Image,ImageDraw,ImageFont,ImageOps
    except ImportError: return None
    cols=min(4,len(frames));tw,th=320,230
    sheet=Image.new('RGB',(cols*tw,math.ceil(len(frames)/cols)*th),'#eeeae1');draw=ImageDraw.Draw(sheet)
    try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
    except OSError: font=ImageFont.load_default()
    for i,f in enumerate(frames):
        im=Image.open(out/f['file']).convert('RGB');im=ImageOps.contain(im,(312,195));x=(i%cols)*tw;y=(i//cols)*th
        sheet.paste(im,(x+(tw-im.width)//2,y));draw.text((x+6,y+199),f['file']+'  '+f['actual_timecode'],fill='#132d37',font=font)
    dest=out/'contact-sheet.png';sheet.save(dest)
    return artifact(dest,'contact_sheet',contains_frames=[f['file'] for f in frames],semantic_analysis=False)
def adjacent_clip(source,out,start,end,number,width):
    dest=out/f'adjacent-{number:02d}.mp4'
    run(['ffmpeg','-hide_banner','-loglevel','error','-nostdin','-ss',f'{start:.6f}','-i',str(source),'-t',f'{end-start:.6f}',
         '-map','0:v:0','-an','-vf',f'scale=min({width}\\,iw):-2','-c:v','libx264','-pix_fmt','yuv420p',
         '-preset','fast','-crf','20','-threads','2','-movflags','+faststart',str(dest)])
    meta=probe(dest)
    return artifact(dest,'silent_adjacent_clip',source_requested_interval_seconds=[start,end],output_duration_seconds=meta['duration_seconds'],audio_removed=True,playback_observed=False)
def tool_versions():
    d={'python':sys.version.split()[0]}
    for name in ('ffmpeg','ffprobe','node'):
        if shutil.which(name):d[name]=run([name,'-version' if name!='node' else '--version'],20).stdout.splitlines()[0]
        else:d[name]=None
    try:d['yt_dlp']=importlib.metadata.version('yt-dlp')
    except importlib.metadata.PackageNotFoundError:d['yt_dlp']=None
    return d

def local_inspect(source,out,at,window=0,step=.25,clips=False,width=1280,source_ref=None):
    if not isinstance(width,int) or not 160<=width<=3840: raise EvidenceError('invalid_width','Width must be 160–3840.')
    source=Path(source).expanduser().resolve();metadata=probe(source)
    centres=[parse_time(t) for t in at];times=targets(centres,metadata['duration_seconds'],window,step)
    if not times:raise EvidenceError('no_timestamps','Provide at least one timestamp.')
    out=prepare(out)
    manifest={'schema_version':1,'created_utc':utc(),'source':metadata,'source_reference':source_ref or {'kind':'authorized_local_file','basename':source.name},
              'tools':tool_versions(),'helper_sha256':sha(Path(__file__)),'sampling':{'centres_seconds':centres,'window_radius_seconds':window,'step_seconds':step},'artifacts':[],
              'evidence_status':{'metadata_extracted':True,'frames_decoded':False,'visual_inspection':False,'continuous_playback_observed':False,'audio_heard':False},
              'limits':'Decoded evidence is not semantic analysis. Inspection attestations are operator records, not proof of perception.'}
    write_json(out/'manifest.json',manifest)
    try:
        for i,t in enumerate(times,1):manifest['artifacts'].append(extract_frame(source,out,t,i,width));write_json(out/'manifest.json',manifest)
        frames=[a for a in manifest['artifacts'] if a['kind']=='decoded_frame'];manifest['evidence_status']['frames_decoded']=True
        contact=contact_sheet(out,frames)
        if contact:manifest['artifacts'].append(contact)
        if clips and window:
            for i,c in enumerate(centres,1):manifest['artifacts'].append(adjacent_clip(source,out,max(0,c-window),min(metadata['duration_seconds'],c+window),i,width))
        if sha(source)!=metadata['sha256']:raise EvidenceError('source_changed','The source changed during inspection; evidence must be regenerated from a stable source.')
        manifest['status']='evidence_ready_not_yet_visually_inspected';write_json(out/'manifest.json',manifest)
    except EvidenceError as e:
        manifest['status']='incomplete';manifest['error']={'code':e.code,'message':e.message};write_json(out/'manifest.json',manifest);raise
    return out/'manifest.json'

class SafeLogger:
    def __init__(self):self.messages=[]
    def debug(self,msg):pass
    def warning(self,msg):self.messages.append(redact(msg))
    def error(self,msg):self.messages.append(redact(msg))
def access_kind(message):
    m=message.lower()
    if any(x in m for x in ('tunnel connection failed','proxyerror','err_tunnel_connection_failed')):return 'environment_network_block'
    if any(x in m for x in ("not a bot",'bot challenge','cloudflare challenge','captcha')):return 'bot_check'
    if any(x in m for x in ('sign in','login','private video','members-only','age-restricted','confirm your age')):return 'login_or_restricted'
    if any(x in m for x in ('not available in your country','geo-restricted','geographic')):return 'geoblocked'
    if any(x in m for x in ('drm','paywall','subscription','payment required')):return 'paywall_or_drm'
    return 'public_access_failed'
def url_inspect(url,out,download=False,captions=None):
    ref=public_reference(url);out=prepare(out);logger=SafeLogger();captions=captions or []
    if len(captions)>3 or any(not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]{0,20}',s) for s in captions):
        raise EvidenceError('invalid_caption_language','Use at most three exact language tags such as en or no.')
    report={'schema_version':1,'checked_utc':utc(),'source_reference':ref,'tools':tool_versions(),'helper_sha256':sha(Path(__file__)),'status':'checking_public_access',
            'artifacts':[],'download_limit_bytes':MAX_SOURCE_BYTES,'download_payload_bytes_seen':0,'credentials_supplied':False,'cookies_supplied':False,'bypass_attempted':False,'semantic_analysis':False,'warnings':[]}
    if report['tools']['yt_dlp']!=YTDLP_PIN:raise EvidenceError('yt_dlp_version','Install the pinned official yt-dlp version from requirements.txt first.')
    import yt_dlp
    def match_filter(info,*,incomplete=False):
        duration=info.get('duration');size=info.get('filesize') or info.get('filesize_approx')
        if info.get('is_live'):return 'Unbounded live video is not supported.'
        if duration and duration>MAX_DURATION:return 'Source exceeds the bounded duration limit.'
        if size and size>MAX_SOURCE_BYTES:return 'Source exceeds the bounded download size.'
    component_bytes={}
    def progress_guard(progress):
        key=progress.get('filename') or progress.get('info_dict',{}).get('format_id')
        if not key:raise EvidenceError('unmetered_download','Download component cannot be metered safely.')
        component_bytes[key]=max(component_bytes.get(key,0),int(progress.get('downloaded_bytes',0)))
        report['download_payload_bytes_seen']=sum(component_bytes.values())
        if report['download_payload_bytes_seen']>MAX_SOURCE_BYTES:raise EvidenceError('download_limit','The aggregate media payload limit was exceeded.')
    opts={'progress_hooks':[progress_guard],'quiet':True,'no_warnings':True,'logger':logger,'noprogress':True,'cachedir':False,'noplaylist':True,'socket_timeout':20,
          'retries':0,'fragment_retries':0,'extractor_retries':0,'skip_unavailable_fragments':False,'usenetrc':False,
          'skip_download':not download,'outtmpl':str(out/'source.%(ext)s'),'format':'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best',
          'merge_output_format':'mp4','max_filesize':MAX_SOURCE_BYTES,'max_downloads':1,'match_filter':match_filter,
          'writesubtitles':bool(captions),'writeautomaticsub':bool(captions),'subtitleslangs':[re.escape(s) for s in captions],'subtitlesformat':'vtt'}
    if shutil.which('node'):opts['js_runtimes']={'node':{}}
    write_json(out/'access-report.json',report)
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info=ydl.extract_info(url,download=download or bool(captions))
        if not isinstance(info,dict) or info.get('_type') in ('playlist','multi_video'):
            raise EvidenceError('single_video_required','Only one explicitly requested public video is supported.')
        if ref.get('video_id') and info.get('id')!=ref['video_id']:
            raise EvidenceError('source_identity_mismatch','Extractor returned a different video ID; source provenance was not verified.')
        report['metadata']={k:(redact(info[k]) if isinstance(info.get(k),str) else info.get(k)) for k in ('id','title','uploader','duration','upload_date','availability','extractor_key')}
        for f in sorted(out.iterdir()):
            if f.is_file() and f.suffix.lower() in ('.mp4','.webm','.mkv','.mov'):
                if f.stat().st_size>MAX_SOURCE_BYTES:raise EvidenceError('download_limit','Downloaded media exceeds the permitted source size.')
                report['artifacts'].append(artifact(f,'downloaded_public_video'))
            elif f.is_file() and f.suffix.lower()=='.vtt':
                lang=next((tag for tag in captions if f.name.endswith('.'+tag+'.vtt')),None)
                kind='publisher_captions' if lang and info.get('subtitles',{}).get(lang) else 'automatic_captions'
                report['artifacts'].append(artifact(f,kind,language=lang,audio_actually_heard=False))
        hasvideo=any(a['kind']=='downloaded_public_video' for a in report['artifacts'])
        report['status']='public_video_downloaded_not_yet_inspected' if hasvideo else 'public_metadata_only'
        report['warnings']=logger.messages[-8:]
        write_json(out/'access-report.json',report)
        return out/'access-report.json'
    except Exception as e:
        # No retry/client switching/cookies/account migration is attempted.
        message=redact(str(e));report['error_code']=e.code if isinstance(e,EvidenceError) else 'extractor_failed';report['status']='blocked_or_failed';report['access_result']=access_kind(str(e));report['error']=message;report['warnings']=logger.messages[-8:]
        report['video_verified']=False;report['captions_verified']=False;write_json(out/'access-report.json',report)
        return out/'access-report.json'
def reference_from_report(path,source):
    report=json.loads(Path(path).read_text());digest=sha(source)
    if report.get('status')!='public_video_downloaded_not_yet_inspected' or report.get('error'):
        raise EvidenceError('source_report_mismatch','Only a successfully downloaded source report can establish provenance.')
    if not any(a.get('kind')=='downloaded_public_video' and a.get('sha256')==digest for a in report.get('artifacts',[])):
        raise EvidenceError('source_report_mismatch','Downloaded source hash does not match this access report.')
    ref=report.get('source_reference',{})
    if ref.get('canonical_url'):return public_reference(ref['canonical_url'])
    if ref.get('kind')!='public_url' or not re.fullmatch(r'[0-9a-f]{64}',str(ref.get('url_sha256',''))):
        raise EvidenceError('source_report_mismatch','Source reference is incomplete.')
    origin=public_reference(ref.get('origin',''))
    if origin.get('kind')!='public_url':raise EvidenceError('source_report_mismatch','Generic source origin is invalid.')
    return {'kind':'public_url','origin':origin['origin'],'url_sha256':ref['url_sha256'],'full_url_logged':False}

def mark_inspected(manifest_path,names,method,note):
    path=Path(manifest_path).resolve();data=json.loads(path.read_text());root=path.parent
    if method not in ('image_view','adjacent_frames_view','actual_playback','captions_read'):raise EvidenceError('inspection_method','Choose an explicit evidence inspection method.')
    for name in names:
        item=next((x for x in data.get('artifacts',[]) if x['file']==name),None)
        if not item or Path(name).name!=name:raise EvidenceError('unknown_artifact','Inspection must reference an artifact in this manifest.')
        target=(root/name).resolve()
        if target.parent!=root or not target.is_file() or sha(target)!=item['sha256']:raise EvidenceError('artifact_changed','Artifact integrity failed; do not attest to changed evidence.')
        if method in ('image_view','adjacent_frames_view') and item['kind'] not in ('decoded_frame','contact_sheet'):raise EvidenceError('method_mismatch','Image inspection requires decoded frames or a contact sheet.')
        if method=='actual_playback' and item['kind'] not in ('silent_adjacent_clip','downloaded_public_video'):raise EvidenceError('method_mismatch','Playback inspection requires a video artifact.')
        if method=='captions_read' and 'captions' not in item['kind']:raise EvidenceError('method_mismatch','Caption inspection requires a caption artifact.')
        item['inspection']['status']='operator_reported_inspected'
        if not any(a['method']==method and a['note']==redact(note) for a in item['inspection']['attestations']):
            item['inspection']['attestations'].append({'at_utc':utc(),'method':method,'note':redact(note),'attestation_not_automatic_perception_proof':True})
    if 'evidence_status' in data:
        data['evidence_status']['visual_inspection']=any(a['inspection']['attestations'] and any(x['method'] in ('image_view','adjacent_frames_view') for x in a['inspection']['attestations']) for a in data['artifacts'])
        data['evidence_status']['continuous_playback_observed']=any(any(x['method']=='actual_playback' for x in a['inspection']['attestations']) for a in data['artifacts'])
    if data.get('evidence_status',{}).get('visual_inspection'):data['status']='evidence_ready_operator_inspection_recorded'
    write_json(path,data);return path

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    sub.add_parser('doctor',help='Show actual tool availability and versions.')
    q=sub.add_parser('inspect',help='Inspect an authorized local video, including non-YouTube video.');q.add_argument('--input',required=True);q.add_argument('--out',required=True);q.add_argument('--at',nargs='+',required=True);q.add_argument('--window',type=float,default=0);q.add_argument('--step',type=float,default=.25);q.add_argument('--clips',action='store_true');q.add_argument('--width',type=int,default=1280);q.add_argument('--access-report')
    q=sub.add_parser('url',help='One ordinary public HTTPS extraction attempt; no credentials/cookies/bypass.');q.add_argument('--url',required=True);q.add_argument('--out',required=True);q.add_argument('--download',action='store_true');q.add_argument('--captions',nargs='*',default=[])
    q=sub.add_parser('mark-inspected');q.add_argument('--manifest',required=True);q.add_argument('--artifact',nargs='+',required=True);q.add_argument('--method',required=True);q.add_argument('--note',required=True)
    a=p.parse_args(argv)
    try:
        if a.command=='doctor':print(json.dumps(tool_versions(),indent=2,allow_nan=False));return 0
        if a.command=='inspect':path=local_inspect(a.input,a.out,a.at,a.window,a.step,a.clips,a.width,reference_from_report(a.access_report,a.input) if a.access_report else None)
        elif a.command=='url':path=url_inspect(a.url,a.out,a.download,a.captions)
        else:path=mark_inspected(a.manifest,a.artifact,a.method,a.note)
        status=json.loads(Path(path).read_text()).get('status')
        print(json.dumps({'manifest':str(path),'command':a.command,'status':status},allow_nan=False));return 3 if status=='blocked_or_failed' else 0
    except EvidenceError as e:print(json.dumps({'error':e.code,'message':e.message},ensure_ascii=False,allow_nan=False));return 2
    except (ValueError,OSError,json.JSONDecodeError):print(json.dumps({'error':'invalid_or_unreadable_input','message':'Input could not be read or validated; raw contents were not logged.'}));return 2
if __name__=='__main__':sys.exit(main())
