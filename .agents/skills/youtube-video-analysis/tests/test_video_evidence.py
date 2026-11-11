import unittest,tempfile,json,subprocess,sys,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import video_evidence as v

class Validation(unittest.TestCase):
 def test_timecodes_and_finite_bounds(self):
  self.assertEqual(v.parse_time('01:02:03.250'),3723.25);self.assertEqual(v.timecode(3723.25),'01:02:03.250')
  for x in ['NaN','inf','-1','1;whoami','00:60','1:60:01','1e300','']:
   with self.subTest(x=x),self.assertRaises(v.EvidenceError):v.parse_time(x)
 def test_signed_urls_and_secret_logs_are_not_persisted(self):
  ref=v.public_reference('https://cdn.example.org/private/TOKENSEGMENT/video.mp4?token=SECRET&sig=ABC')
  self.assertNotIn('SECRET',json.dumps(ref));self.assertNotIn('TOKENSEGMENT',json.dumps(ref));self.assertNotIn('ABC',json.dumps(ref))
  self.assertEqual(v.public_reference('https://youtu.be/agW8_8r_uWU?t=5')['canonical_url'],'https://www.youtube.com/watch?v=agW8_8r_uWU')
  text=v.redact('bad https://cdn.example.org/media?token=SECRET Cookie=VERYPRIVATE')
  self.assertNotIn('SECRET',text);self.assertNotIn('VERYPRIVATE',text)
  for raw in ['Authorization: Bearer SECRET','Cookie: SID=SECRET; HSID=SECONDSECRET','{"token":"SECRET"}']:
   self.assertNotIn('SECRET',v.redact(raw))
  for url in ['file:///etc/passwd','http://youtube.com/','https://x:secret@example.org/','https://127.0.0.1/private','https://127.1/','https://0x7f000001/','https://2130706433/','https://localhost./','https://localhost.localhost/']:
   with self.subTest(url=url),self.assertRaises(v.EvidenceError):v.public_reference(url)
 def test_blocking_classification_is_explicit(self):
  self.assertEqual(v.access_kind('Tunnel connection failed: 403 Forbidden'),'environment_network_block')
  self.assertEqual(v.access_kind("Sign in to confirm you're not a bot"),'bot_check')
  self.assertEqual(v.access_kind('not available in your country'),'geoblocked')
 def test_sampling_clamps_neighbours_but_rejects_invalid_centres(self):
  self.assertEqual(v.targets([.1],2,.2,.1),[0,.1,.2,.3])
  for args in [([2],2,0,.25),([0],2,1,0),([0],2,5,.001),([0],2,5,5e-324)]:
   with self.subTest(args=args),self.assertRaises(v.EvidenceError):v.targets(*args)
 def test_output_never_clobbers_existing_evidence(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'kept';p.mkdir();(p/'user.txt').write_text('keep')
   with self.assertRaises(v.EvidenceError):v.prepare(p)
   self.assertEqual((p/'user.txt').read_text(),'keep')

class RealMedia(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();cls.root=Path(cls.tmp.name);cls.video=cls.root/'source with spaces.mp4'
  subprocess.run(['ffmpeg','-v','error','-f','lavfi','-i','testsrc2=size=320x180:rate=25','-t','2','-c:v','libx264','-pix_fmt','yuv420p','-g','25','-threads','1',str(cls.video)],check=True)
 @classmethod
 def tearDownClass(cls):cls.tmp.cleanup()
 def test_actual_decoded_pts_and_silent_adjacent_clip(self):
  out=self.root/'evidence';path=v.local_inspect(self.video,out,['1.013'],.2,.2,True,320)
  data=json.loads(path.read_text(),parse_constant=lambda x:(_ for _ in ()).throw(ValueError(x)))
  frames=[a for a in data['artifacts'] if a['kind']=='decoded_frame'];self.assertEqual(len(frames),3)
  expected=[.84,1.04,1.24]
  for a,t in zip(frames,expected):
   self.assertAlmostEqual(a['actual_seconds'],t,places=4);self.assertEqual(a['sha256'],v.sha(out/a['file']))
  self.assertFalse(data['evidence_status']['visual_inspection']);self.assertFalse(data['evidence_status']['continuous_playback_observed'])
  clip=next(a for a in data['artifacts'] if a['kind']=='silent_adjacent_clip');self.assertTrue(clip['audio_removed'])
  self.assertTrue(all(s['codec_type']=='video' for s in v.probe(out/clip['file'])['streams']))
 def test_offset_container_timeline(self):
  shifted=self.root/'offset.mp4'
  subprocess.run(['ffmpeg','-v','error','-i',str(self.video),'-c','copy','-output_ts_offset','5',str(shifted)],check=True)
  meta=v.probe(shifted);self.assertAlmostEqual(meta['duration_seconds'],2,places=3)
  out=self.root/'offset-frame';out.mkdir();f=v.extract_frame(shifted,out,1.013,1,320)
  self.assertAlmostEqual(f['actual_seconds'],1.04,places=3)
 def test_last_display_interval_has_an_honest_actual_pts(self):
  out=self.root/'tail';out.mkdir();f=v.extract_frame(self.video,out,1.999,1,320)
  self.assertAlmostEqual(f['actual_seconds'],1.96,places=3);self.assertIn('final available',f['selection'])
 def test_missing_video_and_tampered_evidence_fail(self):
  with self.assertRaises(v.EvidenceError):v.probe(self.root/'missing.mp4')
  out=self.root/'tamper';manifest=v.local_inspect(self.video,out,['0.5'],0,.25,False,320)
  d=json.loads(manifest.read_text());f=d['artifacts'][0]['file'];(out/f).write_bytes(b'changed')
  with self.assertRaises(v.EvidenceError):v.mark_inspected(manifest,[f],'image_view','test')
 def test_whitelisted_remote_metadata_never_serializes_cdn_urls(self):
  from unittest.mock import patch
  import shutil
  out=self.root/'remote-contract'
  def extracted(url,download):
   shutil.copy2(self.video,out/'source.mp4')
   (out/'source.en.vtt').write_text('WEBVTT\n\n00:00.000 --> 00:01.000\nPublic caption example\n')
   return {'id':'agW8_8r_uWU','title':'Example public title','duration':2,'formats':[{'url':'https://cdn.example.org/v?token=SECRET'}], 'url':'https://cdn.example.org/private/TOKENPATH','subtitles':{'en':[{'url':'https://cdn.example.org/sub?sig=SECRET'}]}}
  with patch('yt_dlp.YoutubeDL') as mock:
   mock.return_value.__enter__.return_value.extract_info.side_effect=extracted
   path=v.url_inspect('https://www.youtube.com/watch?v=agW8_8r_uWU',out,True,['en'])
  text=path.read_text();self.assertNotIn('SECRET',text);self.assertNotIn('TOKENPATH',text)
  data=json.loads(text);self.assertEqual(data['status'],'public_video_downloaded_not_yet_inspected')
  self.assertTrue(any(a['kind']=='publisher_captions' for a in data['artifacts']))
  self.assertEqual(v.reference_from_report(path,out/'source.mp4')['video_id'],'agW8_8r_uWU')
 def test_blocked_report_cannot_be_upgraded_by_an_artifact_hash(self):
  out=self.root/'blocked-provenance';out.mkdir();path=out/'access.json';path.write_text(json.dumps({'status':'blocked_or_failed','artifacts':[{'kind':'downloaded_public_video','sha256':v.sha(self.video)}]}))
  with self.assertRaises(v.EvidenceError):v.reference_from_report(path,self.video)
 def test_youtube_path_and_result_id_must_match(self):
  from unittest.mock import patch
  with self.assertRaises(v.EvidenceError):v.public_reference('https://www.youtube.com/nonexistent?v=dQw4w9WgXcQ')
  with patch('yt_dlp.YoutubeDL') as mock:
   mock.return_value.__enter__.return_value.extract_info.return_value={'id':'OTHER_ID123','title':'Different source'}
   path=v.url_inspect('https://www.youtube.com/watch?v=agW8_8r_uWU',self.root/'wrong-id')
  self.assertEqual(json.loads(path.read_text())['error_code'],'source_identity_mismatch')
 def test_aggregate_media_payload_limit(self):
  from unittest.mock import patch
  def extracted(url,download):
   hook=mock.call_args.args[0]['progress_hooks'][0]
   hook({'filename':'video','downloaded_bytes':int(v.MAX_SOURCE_BYTES*.6)})
   hook({'filename':'audio','downloaded_bytes':int(v.MAX_SOURCE_BYTES*.6)})
  with patch('yt_dlp.YoutubeDL') as mock:
   mock.return_value.__enter__.return_value.extract_info.side_effect=extracted
   path=v.url_inspect('https://www.youtube.com/watch?v=agW8_8r_uWU',self.root/'over-budget',True)
  data=json.loads(path.read_text());self.assertEqual(data['error_code'],'download_limit');self.assertGreater(data['download_payload_bytes_seen'],v.MAX_SOURCE_BYTES)
 def test_inspection_marker_never_claims_audio_or_playback(self):
  out=self.root/'marker';manifest=v.local_inspect(self.video,out,['0.5'],0,.25,False,320)
  f=json.loads(manifest.read_text())['artifacts'][0]['file'];v.mark_inspected(manifest,[f],'image_view','unit test of manifest state, not a real visual review')
  data=json.loads(manifest.read_text());self.assertTrue(data['evidence_status']['visual_inspection']);self.assertFalse(data['evidence_status']['audio_heard']);self.assertFalse(data['evidence_status']['continuous_playback_observed'])
  self.assertEqual(data['status'],'evidence_ready_operator_inspection_recorded')
  v.mark_inspected(manifest,[f],'image_view','unit test of manifest state, not a real visual review');self.assertEqual(len(json.loads(manifest.read_text())['artifacts'][0]['inspection']['attestations']),1)
 def test_caption_or_playback_cannot_be_attested_to_a_still(self):
  out=self.root/'method';manifest=v.local_inspect(self.video,out,['0.5'],0,.25,False,320)
  f=json.loads(manifest.read_text())['artifacts'][0]['file']
  for method in ['actual_playback','captions_read']:
   with self.subTest(method=method),self.assertRaises(v.EvidenceError):v.mark_inspected(manifest,[f],method,'not observed')

if __name__=='__main__':unittest.main(verbosity=2)
