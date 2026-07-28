import json, sys, html, os, glob

# Generate Baby A&M-styled parenting pages for one age section.
# Usage: python scripts/build_parenting.py <section>
sys.stdout.reconfigure(encoding='utf-8')
if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/build_parenting.py <section>')
SEC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VI = os.path.join(ROOT, 'content', 'nuoi-day-tre', SEC)
OUT = os.path.join(ROOT, 'nuoi-day-tre')
ART_DIR = os.path.join(OUT, SEC)
BASE_URL = 'https://www.babyam.vn'

SECTION_LABEL = {
    'newborns': 'Trẻ sơ sinh (0–2 tháng)', 'babies': 'Em bé (3–12 tháng)',
    'toddlers': 'Trẻ tập đi (1–3 tuổi)', 'preschoolers': 'Tuổi mẫu giáo (3–5 tuổi)',
    'school-age': 'Tuổi đi học (5–8 tuổi)', 'pre-teens': 'Tiền thiếu niên (9–11 tuổi)',
    'teens': 'Thiếu niên (12–18 tuổi)'}
SECTION_EMOJI = {'newborns':'🍼','babies':'👶','toddlers':'🧒','preschoolers':'🎨',
    'school-age':'🎒','pre-teens':'🚲','teens':'🎓'}
CAT_LABEL = {
    'behaviour':'Hành vi','breastfeeding-bottle-feeding':'Nuôi bằng sữa mẹ & sữa công thức',
    'connecting-communicating':'Gắn kết & giao tiếp','development':'Phát triển',
    'health-daily-care':'Sức khỏe & chăm sóc hằng ngày','play-learning':'Chơi & học',
    'premature-babies-sick-babies':'Trẻ sinh non & trẻ ốm','sleep':'Giấc ngủ','videos':'Video',
    'parenting-in-pictures':'Hướng dẫn bằng hình ảnh','breastfeeding-bottle-feeding-solids':'Bú mẹ, bú bình & ăn dặm',
    'nutrition-fitness':'Dinh dưỡng & vận động','safety':'An toàn','school-learning':'Học tập',
    'family-life':'Đời sống gia đình','communicating-relationships':'Giao tiếp & quan hệ',
    'health-wellbeing':'Sức khỏe & tinh thần','grown-ups':'Dành cho cha mẹ'}

FAVICON="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%237FAD8F'/%3E%3Ctext x='50%25' y='54%25' text-anchor='middle' font-family='Arial, sans-serif' font-size='28' fill='white'%3EBA%3C/text%3E%3C/svg%3E"
FONTS='<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap" rel="stylesheet">'

ART_STYLE='''*{box-sizing:border-box;margin:0;padding:0}
:root{--green:#7FAD8F;--green-dark:#6a9a76;--green-light:#eaf2ec;--dark:#29303D;--text:#4a5568;--border:#e8eae6}
body{font-family:'Be Vietnam Pro',sans-serif;color:var(--dark);background:#fff;line-height:1.7;padding:40px 20px}
.container{max-width:800px;margin:0 auto}
.crumb{font-size:13px;color:#9aa3af;margin-bottom:18px}
.crumb a{color:var(--green);text-decoration:none}
.crumb a:hover{text-decoration:underline}
.article-meta{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.cat{padding:4px 12px;border-radius:20px;background:var(--green);color:#fff;font-size:12px;font-weight:600}
h1{font-family:'Lora',serif;font-size:clamp(26px,4vw,38px);line-height:1.2;margin-bottom:12px}
.lead{font-size:17px;color:var(--text);margin-bottom:24px}
.article-content{font-size:16px;color:var(--text);line-height:1.8}
.article-content p{margin-bottom:20px}
.article-content h2{font-family:'Lora',serif;font-size:22px;margin:32px 0 14px;color:var(--dark)}
.article-content ul{margin:16px 0;padding-left:24px}
.article-content li{margin-bottom:8px}
.article-content strong{color:var(--dark)}
.cta-box{background:linear-gradient(135deg,#7FAD8F,#6a9a76);border-radius:16px;padding:32px;text-align:center;margin-top:48px;color:#fff}
.cta-box h3{font-family:'Lora',serif;font-size:24px;margin-bottom:12px}
.cta-box p{margin-bottom:20px;opacity:.9}
.cta-box a{display:inline-flex;gap:8px;background:#fff;color:var(--green);padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none}
.src-note{font-size:12px;color:#9aa3af;margin-top:28px;text-align:center}
.src-note a{color:var(--green)}'''

def esc(s):
    s=html.escape(s)
    return s.replace('&lt;strong&gt;','<strong>').replace('&lt;/strong&gt;','</strong>')

def render_blocks(blocks):
    out=[]
    for b in blocks:
        if b.get('t')=='p' and b.get('text','').strip():
            out.append(f'<p>{esc(b["text"])}</p>')
        elif b.get('t')=='ul' and b.get('items'):
            out.append('<ul>'+''.join(f'<li>{esc(i)}</li>' for i in b['items'])+'</ul>')
        elif b.get('t')=='note' and b.get('text','').strip():
            out.append(f'<p><em>{esc(b["text"])}</em></p>')
    return out

ART_TMPL='''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="{canonical}">
<title>{title} - Baby A&M</title>
<meta name="description" content="{sub}">
<link rel="icon" href="{fav}">
{fonts}
<style>
{style}
</style>
</head>
<body>
<div class="container">
<div class="crumb"><a href="/index.html">Baby A&M</a> › <a href="/nuoi-day-tre.html">Nuôi dạy trẻ</a> › <a href="/nuoi-day-tre/{sec}.html">{seclabel}</a> › {catlabel}</div>
<div class="article-meta"><span class="cat">{catlabel}</span></div>
<h1>{title}</h1>
<p class="lead">{sub}</p>
<div class="article-content">
{content}
</div>
<div class="cta-box">
<h3>Đồng hành cùng mẹ và bé</h3>
<p>Baby A&M – sản phẩm Mẹ và Bé chính hãng. Liên hệ để được tư vấn cho từng giai đoạn của con.</p>
<a href="https://zalo.me/0967339539">Chat Zalo ngay</a>
</div>
<p class="src-note">Nội dung được dịch và biên tập từ <a href="{src}" target="_blank" rel="noopener">Raising Children Network</a>. Chỉ mang tính tham khảo, không thay thế cho lời khuyên của chuyên gia y tế.</p>
</div>
</body>
</html>
'''

files=sorted(glob.glob(os.path.join(VI,'**','*.json'),recursive=True))
arts=[]  # (path, title, sub, cat)
for f in files:
    d=json.load(open(f,encoding='utf-8'))
    path=d['path']; cat=path.split('/')[0]
    catlabel=CAT_LABEL.get(cat,cat.replace('-',' ').title())
    content=[]
    for s in d['sections']:
        bl=render_blocks(s.get('blocks',[]))
        if not bl: continue
        content.append(f'<h2>{esc(s["h"])}</h2>\n'+'\n'.join(bl))
    if not content: continue
    outp=os.path.join(ART_DIR,path+'.html'); os.makedirs(os.path.dirname(outp),exist_ok=True)
    src=f'https://raisingchildren.net.au/{SEC}/{path}'
    page=ART_TMPL.format(title=esc(d['title']),sub=html.escape(d.get('subtitle','')),fav=FAVICON,
        canonical=f'{BASE_URL}/nuoi-day-tre/{SEC}/{path}.html',
        fonts=FONTS,style=ART_STYLE,sec=SEC,seclabel=SECTION_LABEL.get(SEC,SEC),
        catlabel=catlabel,content='\n'.join(content),src=src)
    open(outp,'w',encoding='utf-8').write(page)
    arts.append((path,d['title'],d.get('subtitle',''),cat,catlabel))

# Section hub: group by category
from collections import OrderedDict
bycat=OrderedDict()
for path,title,sub,cat,catlabel in arts:
    bycat.setdefault((cat,catlabel),[]).append((path,title,sub))
cat_blocks=[]
for (cat,catlabel),items in bycat.items():
    cards=[]
    for path,title,sub in items:
        cards.append(f'''      <a class="pt-card" href="/nuoi-day-tre/{SEC}/{path}.html">
        <h3>{esc(title)}</h3><p>{html.escape(sub)}</p></a>''')
    cat_blocks.append(f'    <h2 class="cat-h">{esc(catlabel)} <span>({len(items)})</span></h2>\n    <div class="pt-grid">\n'+'\n'.join(cards)+'\n    </div>')

HUB_STYLE='''*{box-sizing:border-box;margin:0;padding:0}
:root{--green:#7FAD8F;--green-dark:#6a9a76;--green-light:#eaf2ec;--dark:#29303D;--text:#4a5568;--border:#e8eae6}
body{font-family:'Be Vietnam Pro',sans-serif;color:var(--dark);background:#fff;line-height:1.7}
.hero{background:linear-gradient(135deg,#eaf2ec,#dce9e0);padding:46px 20px;text-align:center}
.hero .crumb{font-size:13px;margin-bottom:14px}
.hero .crumb a{color:var(--green-dark);text-decoration:none;font-weight:600}
.hero h1{font-family:'Lora',serif;font-size:clamp(28px,4vw,40px)}
.hero p{color:var(--text);margin-top:8px}
.container{max-width:1000px;margin:0 auto;padding:36px 20px 60px}
.cat-h{font-family:'Lora',serif;font-size:21px;color:var(--green-dark);margin:36px 0 4px;border-bottom:2px solid var(--green-light);padding-bottom:8px}
.cat-h span{font-size:13px;color:var(--text);font-family:'Be Vietnam Pro'}
.pt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-top:16px}
.pt-card{display:block;background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px 18px;text-decoration:none;color:inherit;transition:transform .15s,box-shadow .15s}
.pt-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(127,173,143,.18)}
.pt-card h3{font-size:15.5px;margin-bottom:6px;color:var(--dark);line-height:1.4}
.pt-card p{font-size:13px;color:var(--text);line-height:1.55}
footer{text-align:center;font-size:12px;color:#9aa3af;border-top:1px solid var(--border);margin-top:48px;padding-top:18px}
footer a{color:var(--green)}'''

hub=f'''<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="{BASE_URL}/nuoi-day-tre/{SEC}.html">
<title>{SECTION_LABEL.get(SEC,SEC)} - Nuôi dạy trẻ - Baby A&M</title>
<meta name="description" content="Cẩm nang nuôi dạy {SECTION_LABEL.get(SEC,SEC)} cùng Baby A&M.">
<link rel="icon" href="{FAVICON}">
{FONTS}
<style>
{HUB_STYLE}
</style>
</head>
<body>
<header class="hero">
<div class="crumb"><a href="/index.html">Baby A&M</a> › <a href="/nuoi-day-tre.html">Nuôi dạy trẻ</a></div>
<h1>{SECTION_EMOJI.get(SEC,'')} {SECTION_LABEL.get(SEC,SEC)}</h1>
<p>{len(arts)} bài viết · kiến thức nuôi dạy con theo độ tuổi</p>
</header>
<main class="container">
{chr(10).join(cat_blocks)}
<footer>
<p>Nội dung dịch & biên tập từ <a href="https://raisingchildren.net.au/{SEC}" target="_blank" rel="noopener">Raising Children Network</a>.</p>
<p>Baby A&M — Chỉ mang tính tham khảo, không thay thế lời khuyên của chuyên gia y tế.</p>
</footer>
</main>
</body>
</html>
'''
os.makedirs(OUT,exist_ok=True)
open(os.path.join(OUT,f'{SEC}.html'),'w',encoding='utf-8').write(hub)
print(f'{SEC}: generated {len(arts)} article pages + section hub ({len(bycat)} categories)')
