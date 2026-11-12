#!/usr/bin/env python3
"""Reviewed navigation transform: reads full actual production public tree and writes an explicit overlay.
It does not replace production content with contributor fixtures, deploy or change services.
"""
from pathlib import Path
import argparse,re,json,hashlib,html,sys
from html.parser import HTMLParser
from urllib.parse import urlsplit,urljoin
from legacy_navigation import classify,STORY,ART
STORY.update({'retsspeil','rettspeil','innsynsverksted','juridisk','fri-presse','legal','press','book'})
COMMON={'kontakt','contact','om','about','personvern','privacy','vilkar','terms','samtaleregler'}
COPY={
'no':dict(home='Hovedmeny',back='Tilbake til hovedmenyen',choose='Velg retning',story='Stemmen fra innsiden',art='Kunstsamfunnet og forumene',diary='Dagbok fra innsiden',book='Boken',legal='Juridisk verktøy',press='Fri presse',mirror='Rettspeil',gallery='Galleri',clothes='Kunst og klær',music='Musikk',forum='Forumene',contact='Kontakt oss',collab='Samarbeid',top='Til toppen',heading='Velg din retning',storydesc='Dagbok, dokumentasjon, fri presse, juridiske verktøy og boken.',artdesc='Kunst, musikk og muligheter for samarbeid. Forum for innsatte og pårørende er under utvikling.',why='To selvstendige retninger. Samarbeid med kunstfellesskapet innebærer ikke tilslutning til aktivismens synspunkter.',rooms='Egne forum skal gi innsatte og pårørende plass til ulike erfaringer og behov for støtte.'),
'en':dict(home='Main menu',back='Back to the main menu',choose='Choose a direction',story='The Voice from Inside',art='The Art Community and forums',diary='Diary from Inside',book='The Book',legal='Legal tools',press='Free press',mirror='Justice Mirror',gallery='Gallery',clothes='Art and clothing',music='Music',forum='Forums',contact='Contact us',collab='Collaboration',top='Back to top',heading='Choose your direction',storydesc='Diary, documentation, free press, legal tools and the book.',artdesc='Art, music and opportunities to collaborate. Forums for prisoners and families are in development.',why='Two separate directions. Supporting the creative community does not imply endorsing the activism or its views.',rooms='Separate forums are intended to give prisoners and families space for their different experiences and support needs.'),
'zh':dict(home='主菜单',back='返回主菜单',choose='选择方向',story='来自内部的声音',art='艺术社区与论坛',diary='来自内部的日记',book='书籍',legal='法律工具',press='新闻自由',mirror='正义之镜',gallery='画廊',clothes='艺术与服装',music='音乐',forum='论坛',contact='联系我们',collab='合作',top='返回顶部',heading='选择你的方向',storydesc='日记、文件、新闻自由、法律工具与书籍。',artdesc='艺术、音乐与合作机会。面向囚犯和家属的论坛正在开发中。',why='两个独立方向。支持艺术社区不代表认同倡议活动的所有观点。',rooms='独立论坛旨在为囚犯和家属各自不同的经历和支持需求提供空间。')}
def text(key,locale):return html.escape(COPY[locale][key])
def trans(key,locale,tag='span'):
 return '<'+tag+''.join(' data-nav-'+l+'="'+html.escape(COPY[l][key],quote=True)+'"' for l in COPY)+'>'+text(key,locale)+'</'+tag+'>'
def url(path,en):
 return ('/en' if en else '')+({'/kunstfellesskap/':'/art-community/','/butikk/':'/shop/','/musikk/':'/music/'}.get(path,path) if en else path)
def a(key,path,en,attrs=''):
 return '<a href="'+html.escape(url(path,en),quote=True)+'" '+attrs+'>'+trans(key,'en' if en else 'no')+'</a>'
def category(rel):
 k,en=classify(rel)
 if k=='unknown':
  parts=list(rel.parts);parts=parts[1:] if en else parts
  if parts and parts[0] in COMMON:return 'common',en
 return ('main' if k=='home' else k),en

def diary_links(source):
 """Use dated source navigation only; never invent dates or inmate identities."""
 entries={False:{},True:{}}
 for f in sorted(source.rglob('*.html')):
  old=f.read_text();_,en=category(f.relative_to(source))
  for m in re.finditer(r'<a\b([^>]*\bhref=["\']([^"\']+)["\'][^>]*)>(.*?)</a>',old,re.S|re.I):
   href=html.unescape(m[2]);v=html.unescape(re.sub('<[^>]+>',' ',m[3]));v=' '.join(v.split())
   match=re.search(r'(\d{2}\.\d{2}\.\d{4})\s*[·•|–-]?\s*(?:Innsatt|Prisoner)\s*(\d{4}-?\d{2})',v,re.I)
   if not match:
    ar=re.search(r'aria-label=["\']([^"\']+)',m[1]);match=re.search(r'(\d{2}\.\d{2}\.\d{4})\s*[·•|–-]?\s*(?:Innsatt|Prisoner)\s*(\d{4}-?\d{2})',ar[1] if ar else '',re.I)
   if not match:continue
   resolved=urljoin('https://thevoicefrominside.dev/'+str(f.relative_to(source).parent)+'/',href)
   p=urlsplit(resolved)
   if p.netloc!='thevoicefrominside.dev' or '/dagbok/' not in p.path:continue
   label=match[1]+' · Innsatt '+match[2]
   entries[en][p.path]=(match[1],label)
 return entries

def nav(kind,en,entries):
 l='en' if en else 'no';open='<nav class="sfi-navigation" id="sfi-navigation" aria-label="'+text('home',l)+'"><ul>'
 if kind=='main':return open+'<li class="sfi-section"><details data-direction-menu>'+trans('choose',l,'summary')+'<ul class="sfi-submenu"><li>'+a('story','/dagbok/',en,'data-direction-choice="story"')+'</li><li>'+a('art','/kunstfellesskap/',en,'data-direction-choice="art"')+'</li></ul></details></li></ul></nav>'
 items=[('press','/presse/'),('legal','/juridisk-motvekt/'),('mirror','/rettsspeil/'),('book','/boken/')] if kind=='story' else [('gallery','/galleri-3d/'),('clothes','/butikk/'),('music','/musikk/'),('forum','/kunstfellesskap/#forum') ] if kind=='art' else []
 content='<li class="sfi-section">'+a('back','/#top',en,'data-return-main')+'</li>'
 if kind=='story':
  links=[]
  for path,(date,label) in sorted(entries[en].items(),key=lambda x:tuple(map(int,x[1][0].split('.')[::-1])),reverse=True):
   links.append('<li><a data-diary-entry href="'+html.escape(path,quote=True)+'">'+html.escape(label)+'</a></li>')
  content+='<li class="sfi-section">'+a('diary','/dagbok/',en)+'<details data-diary-menu><summary aria-label="'+text('diary',l)+'">⌄</summary><ul class="sfi-submenu">'+''.join(links)+'</ul></details></li>'
 elif kind=='art':content+='<li class="sfi-section">'+a('art','/kunstfellesskap/',en)+'</li>'
 return open+content+''.join('<li class="sfi-section">'+a(key,path,en)+'</li>'for key,path in items)+'</ul></nav>'

def bottom(en):
 l='en' if en else 'no'
 return '<section id="home-entrances" class="home-entrances clean-direction-gate" aria-labelledby="home-entrances-title" data-main-direction-gate><header><h2 id="home-entrances-title">'+trans('heading',l)+'</h2></header><div class="home-entrances-grid"><section class="home-entrance" data-direction-card="story"><p class="home-entrance-label">01</p><h3>'+a('story','/dagbok/',en)+'</h3><p>'+trans('storydesc',l)+'</p></section><section class="home-entrance" data-direction-card="art"><p class="home-entrance-label">02</p><h3>'+a('art','/kunstfellesskap/',en)+'</h3><p>'+trans('artdesc',l)+'</p></section></div><p class="home-entrances-distinction">'+trans('why',l)+'</p><p>'+trans('rooms',l)+'</p><nav class="clean-main-actions" aria-label="'+text('home',l)+'">'+a('top','/#top',en)+a('contact','/collaborate/#contact',en)+a('collab','/collaborate/',en)+'</nav></section>'

class Parser(HTMLParser):
 def __init__(self,s,rel,kind):
  super().__init__(convert_charrefs=False);self.s=s;self.rel=rel;self.kind=kind;self.lines=[0]+[m.end()for m in re.finditer('\n',s)];self.stack=[];self.edits=[];self.cross=[]
 def source_offset(self):line,col=self.getpos();return self.lines[line-1]+col
 def handle_starttag(self,t,attrs):
  if t!='a':return
  d=dict(attrs);href=d.get('href','');p=urlsplit(urljoin('https://thevoicefrominside.dev/'+str(self.rel.parent)+'/',href));dest=Path(p.path.strip('/') or 'index.html');dest=dest if dest.suffix else dest/'index.html';to,_=category(dest);cross=self.kind in ('story','art')and to in ('story','art')and to!=self.kind and p.netloc in ('thevoicefrominside.dev','www.thevoicefrominside.dev')
  self.stack.append((self.source_offset(),len(self.get_starttag_text()),cross,href))
 def handle_endtag(self,t):
  if t!='a'or not self.stack:return
  start,length,cross,href=self.stack.pop();end=self.source_offset();end2=self.s.find('>',end)+1
  if cross:self.edits.append((start,end2,'<span class="split-separated-reference">'+self.s[start+length:end]+'</span>'));self.cross.append(href)

def rewrite(old,rel,entries):
 kind,en=category(rel)
 old=re.sub(r'<link rel="stylesheet" href="/assets/split-navigation.css">\n?','',old)
 old=re.sub(r'<script defer src="/assets/split-navigation.js"></script>\n?','',old)
 if '<!-- site-navigation-start -->' not in old:return None,{'kind':kind,'noHeader':True}
 a1=old.index('<!-- site-navigation-start -->');b=old.index('<!-- site-navigation-end -->',a1)
 block=old[a1:b];block,n=re.subn(r'<nav\b[^>]*\bid="sfi-navigation"[^>]*>.*?</nav>',lambda _:nav(kind,en,entries),block,count=1,flags=re.S)
 if n!=1:raise ValueError('Missing nav: '+str(rel))
 new=old[:a1]+block+old[b:]
 if rel.as_posix() in ('collaborate/index.html','en/collaborate/index.html') and 'id="contact"' not in new:
  new=re.sub(r'<a(?=\s+href="mailto:)', '<a id="contact"',new,count=1)
 # Known global promotional/UI blocks are not original article text.
 for marker in ['site-tools','follow']:
  new=re.sub(r'<!-- '+marker+r'-start -->.*?<!-- '+marker+r'-end -->','',new,flags=re.S)
 new=re.sub(r'<header class="mast">.*?</header>','',new,flags=re.S)
 if kind!='art':
  new=re.sub(r'<!-- community-widget-start -->.*?<!-- community-widget-end -->','',new,flags=re.S)
 # Existing legacy footer is duplicate directionless navigation. Keep article author within article.
 new=re.sub(r'<footer class="(?:footer|clean-section-footer)">.*?</footer>','',new,flags=re.S)
 if kind!='main':
  new=new.replace('</body>','<footer class="clean-section-footer">'+a('back','/#top',en,'data-return-main')+'</footer></body>',1)
 new=re.sub(r'<body\b([^>]*)>',lambda m:'<body'+re.sub(r'\sdata-site-direction=["\'][^"\']+["\']','',m[1])+' data-site-direction="'+kind+'">',new,count=1,flags=re.I)
 if kind=='main':
  if not re.search(r'id=[\"\']top[\"\']',new):new=new.replace('<body','<body id="top"',1)
  new,n=re.subn(r'<!-- public-entrances-start -->.*?<!-- public-entrances-end -->','<!-- public-entrances-start -->'+bottom(en)+'<!-- public-entrances-end -->',new,count=1,flags=re.S)
  if n!=1:raise ValueError('No main direction gate: '+str(rel))
  new=re.sub(r'<!-- book-status-start -->.*?<!-- book-status-end -->','',new,flags=re.S)
  new=re.sub(r'<section class="minds-gallery".*?</section>','',new,flags=re.S)
  new=re.sub(r'<div class="hero">.*?</div>\s*</div>','',new,flags=re.S)
  # Keep the shared film and two-direction gate as the only main content.
  end_marker='<!-- public-entrances-end -->'
  ei=new.index(end_marker)+len(end_marker)
  close=new.index('</main>',ei)
  new=new[:ei]+new[close:]
 # Remove known duplicated site-level navigation/footer; preserve article text/illustrations.
 new=re.sub(r'<nav\b(?=[^>]*class=["\'][^"\']*\b(?:chapter-nav|review-nav)\b)[^>]*>.*?</nav>','',new,flags=re.S|re.I)
 if kind in ('story','art'):
  p=Parser(new,rel,kind);p.feed(new)
  for start,end,replacement in sorted(p.edits,reverse=True):new=new[:start]+replacement+new[end:]
 else:p=None
 if '/assets/split-navigation.css' not in new:new=new.replace('</head>','<link rel="stylesheet" href="/assets/split-navigation.css">\n</head>',1)
 if '/assets/split-navigation.js' not in new:new=new.replace('</body>','<script defer src="/assets/split-navigation.js"></script>\n</body>',1)
 return new,{'kind':kind,'neutralizedCrossLinks':p.cross if p else []}

CSS='''/* Two clear directions, preserving the existing film and reading layouts. */
.sfi-navigation>ul{justify-content:center;gap:.35rem}.sfi-section>details>summary{cursor:pointer;min-height:44px;padding:10px 14px;display:flex;align-items:center;gap:.5rem;list-style:none}.sfi-section>details>summary::after{content:"⌄"}.sfi-section summary:focus-visible,.sfi-navigation a:focus-visible{outline:2px solid #d9ba81;outline-offset:3px}.sfi-submenu [data-diary-entry]{white-space:nowrap}.clean-direction-gate{max-width:1100px;margin:0 auto;padding:clamp(36px,7vw,90px) 24px}.clean-direction-gate h2{font-size:clamp(1.6rem,4vw,3rem);letter-spacing:-.03em}.clean-direction-gate .home-entrances-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}.clean-direction-gate .home-entrance{padding:32px;border:1px solid #81735655;border-radius:18px;background:#121c22cc}.clean-direction-gate .home-entrance[data-direction-card="art"]{background:#182622cc}.clean-direction-gate .home-entrance-label{font-size:.8rem;letter-spacing:.2em;color:#d9ba81}.clean-direction-gate h3{font-size:clamp(1.3rem,2.5vw,1.8rem)}.clean-direction-gate h3 a{color:inherit}.clean-direction-gate p{max-width:72ch;line-height:1.7}.clean-main-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}.clean-main-actions a{padding:10px 18px;border:1px solid #8a9ca355;border-radius:999px}.split-separated-reference{color:inherit}@media(max-width:680px){.clean-direction-gate .home-entrances-grid{grid-template-columns:1fr}.clean-direction-gate .home-entrance{padding:24px}.sfi-submenu{max-height:65vh;overflow:auto}}'''

def run(source,output):
 source=source.resolve();output=output.resolve();assert source!=output and source not in output.parents
 if output.exists():raise ValueError('Output must not exist')
 output.mkdir(parents=True);entries=diary_links(source);report=[]
 for f in sorted(source.rglob('*.html')):
  if f.is_symlink():raise ValueError('Symlink')
  rel=f.relative_to(source);old=f.read_text();new,row=rewrite(old,rel,entries)
  if new is None:continue
  dst=output/rel;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(new)
  report.append({'path':str(rel),'beforeSHA256':hashlib.sha256(old.encode()).hexdigest(),'afterSHA256':hashlib.sha256(new.encode()).hexdigest(),**row})
 (output/'assets').mkdir(exist_ok=True);(output/'assets/split-navigation.css').write_text(CSS);(output/'assets/split-navigation.js').write_text((Path(__file__).parent/'split-navigation-runtime.js').read_text())
 (output.parent/'NAVIGATION-TRANSFORM-REPORT.json').write_text(json.dumps({'source':str(source),'output':str(output),'diaryEntries':{str(k):v for k,v in entries.items()},'pages':report},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'pages':len(report),'diaryNO':len(entries[False]),'diaryEN':len(entries[True]),'crossLinksNeutralized':sum(len(r.get('neutralizedCrossLinks',[]))for r in report)}))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('source',type=Path);parser.add_argument('output',type=Path);v=parser.parse_args();run(v.source,v.output)
