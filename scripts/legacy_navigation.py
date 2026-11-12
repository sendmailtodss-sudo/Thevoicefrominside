#!/usr/bin/env python3
"""Generate navigation-only patches for a copied public tree; never touches source.
Existing page content and original files remain unchanged. Manual route review required.
"""
import argparse, pathlib, re, html, json, hashlib
STORY={'dagbok','boken','kapitler','kapittel-9','kapittel-10','kapittel-11','presse','juridisk-motvekt','inmaite','innsyn','rettsspeil','klagehjelp','analyse','analyseverksted','maite','analysis','counsel-choice','lawyer-account','gjennomgang','review','innsyn-i-makt','den-trojanske-hesten','fight-for-whats-right','stemmer','advokatkonto','advokatvalg','nytt','statistikk'}
ART={'kunstfellesskap','kunstsamfunnet','galleri-3d','butikk','musikk','bidrag','collaborate','originalverk','for-oss-alle','forum','art-community','creative-community','kunstner','artist','music','shop','original-art','verksted'}
TRANSLATE={'Hovedmeny':('Main navigation','主菜单'),'Tilbake til hovedmenyen':('Back to the main menu','返回主菜单'),'Velg retning':('Choose a direction','选择方向'),'Stemmen fra innsiden':('The Voice from Inside','来自内部的声音'),'Kunstsamfunnet og forumene':('The Art Community and forums','艺术社区与论坛'),'Dagbok fra innsiden':('Diary from Inside','来自内部的日记'),'Boken':('The Book','书籍'),'Juridiske verktøy':('Legal tools','法律工具'),'Fri presse':('Free press','新闻自由'),'Kunstsamfunnet':('The Art Community','艺术社区'),'Galleri':('Gallery','画廊'),'Kunst og klær':('Art and clothing','艺术与服装'),'Musikk':('Music','音乐'),'Forumene':('Forums','论坛'),'Samarbeid':('Collaboration','合作')}
def anchor(label,url,en):
 english,zh=TRANSLATE[label]; rendered=english if en else label
 return '<a href="'+html.escape(url,quote=True)+'" data-nav-no="'+html.escape(label,quote=True)+'" data-nav-en="'+html.escape(english,quote=True)+'" data-nav-zh="'+html.escape(zh,quote=True)+'">'+html.escape(rendered)+'</a>'
def nav(kind,en):
 pre='/en' if en else ''
 english_paths={'/kunstfellesskap/':'/art-community/','/butikk/':'/shop/','/musikk/':'/music/','/kunstfellesskap/#forum':'/art-community/#forum'}
 a=lambda label,path: anchor(label,pre+(english_paths.get(path,path) if en else path),en)
 home=a('Tilbake til hovedmenyen','/#top')
 if kind=='home':
  return '<nav class="sfi-navigation" id="sfi-navigation" aria-label="'+('Main navigation' if en else 'Hovedmeny')+'"><ul><li class="sfi-section"><details><summary class="split-summary" data-nav-no="Velg retning" data-nav-en="Choose a direction" data-nav-zh="选择方向">'+('Choose a direction' if en else 'Velg retning')+'</summary><ul class="sfi-submenu"><li>'+a('Stemmen fra innsiden','/dagbok/')+'</li><li>'+a('Kunstsamfunnet og forumene','/kunstfellesskap/')+'</li></ul></details></li></ul></nav>'
 if kind=='story': items=[('Dagbok fra innsiden','/dagbok/'),('Boken','/boken/'),('Juridiske verktøy','/juridisk-motvekt/'),('Fri presse','/presse/')]
 elif kind=='art': items=[('Kunstsamfunnet','/kunstfellesskap/'),('Galleri','/galleri-3d/'),('Kunst og klær','/butikk/'),('Musikk','/musikk/'),('Forumene','/kunstfellesskap/'),('Samarbeid','/collaborate/')]
 else:items=[]
 return '<nav class="sfi-navigation" id="sfi-navigation" aria-label="'+('Main navigation' if en else 'Hovedmeny')+'"><ul><li class="sfi-section">'+home+'</li>'+''.join('<li class="sfi-section">'+a(label,path)+'</li>' for label,path in items)+'</ul></nav>'
def classify(path):
 parts=list(path.parts);en=parts and parts[0]=='en'
 if en:parts=parts[1:]
 if parts==['index.html']:return 'home',bool(en)
 name=parts[0] if parts else ''
 return ('story' if name in STORY else 'art' if name in ART else 'unknown'),bool(en)
def rewrite(data,path):
 kind,en=classify(path)
 if '<!-- site-navigation-start -->' not in data:return None,kind
 start=data.index('<!-- site-navigation-start -->');end=data.index('<!-- site-navigation-end -->',start)
 block=data[start:end];p=re.compile(r'<nav\b[^>]*\bid="sfi-navigation"[^>]*>.*?</nav>',re.S)
 block,n=p.subn(lambda _:nav(kind,en),block,count=1)
 if n!=1:raise ValueError('navigation structure not found '+str(path))
 block += '<link rel="stylesheet" href="/assets/split-navigation.css"><script defer src="/assets/split-navigation.js"></script>\n'
 return data[:start]+block+data[end:],kind
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('source',type=pathlib.Path);a.add_argument('output',type=pathlib.Path);args=a.parse_args()
 src=args.source.resolve();out=args.output.resolve();assert src!=out and src not in out.parents and out not in src.parents
 assert not out.exists();out.mkdir(parents=True)
 manifest={'home':[],'story':[],'art':[],'unknown':[],'unchangedNoHeader':[]}
 for path in sorted(src.rglob('*.html')):
  if path.is_symlink():raise ValueError('symlink')
  rel=path.relative_to(src);old=path.read_text();new,kind=rewrite(old,rel)
  if new is None:manifest['unchangedNoHeader'].append(str(rel));continue
  dest=out/rel;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(new)
  manifest[kind].append({'path':str(rel),'before_sha256':hashlib.sha256(old.encode()).hexdigest(),'after_sha256':hashlib.sha256(new.encode()).hexdigest()})
 (out/'assets').mkdir(exist_ok=True)
 (out/'assets/split-navigation.css').write_text('.sfi-section summary.split-summary{width:auto;min-height:48px;padding:8px 18px;display:flex;gap:8px;font-weight:650}.sfi-section summary.split-summary::after{content:"⌄";margin-left:8px}.sfi-section summary.split-summary:focus-visible{outline:3px solid #a46c30}.sfi-navigation .sfi-section a{white-space:normal}\n')
 (out/'assets/split-navigation.js').write_text((pathlib.Path(__file__).parent/'split-navigation-runtime.js').read_text())
 (out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:len(v) for k,v in manifest.items()}))
