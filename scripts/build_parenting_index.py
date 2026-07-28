import os,glob,sys,html
sys.stdout.reconfigure(encoding='utf-8')
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=ROOT
PT=os.path.join(OUT,'nuoi-day-tre')
BASE_URL='https://www.babyam.vn'
ORDER=['newborns','babies','toddlers','preschoolers','school-age','pre-teens','teens']
LABEL={'newborns':'Trẻ sơ sinh','babies':'Em bé','toddlers':'Trẻ tập đi','preschoolers':'Tuổi mẫu giáo','school-age':'Tuổi đi học','pre-teens':'Tiền thiếu niên','teens':'Thiếu niên'}
AGE={'newborns':'0–2 tháng','babies':'3–12 tháng','toddlers':'1–3 tuổi','preschoolers':'3–5 tuổi','school-age':'5–8 tuổi','pre-teens':'9–11 tuổi','teens':'12–18 tuổi'}
EMOJI={'newborns':'🍼','babies':'👶','toddlers':'🧒','preschoolers':'🎨','school-age':'🎒','pre-teens':'🚲','teens':'🎓'}
FAVICON="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%237FAD8F'/%3E%3Ctext x='50%25' y='54%25' text-anchor='middle' font-family='Arial, sans-serif' font-size='28' fill='white'%3EBA%3C/text%3E%3C/svg%3E"
FONTS='<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Lora:wght@400;500;600;700&display=swap" rel="stylesheet">'
cards=[]; total=0
for sec in ORDER:
    hub=os.path.join(PT,f'{sec}.html')
    live=os.path.exists(hub)
    n=len(glob.glob(os.path.join(PT,sec,'**','*.html'),recursive=True)) if live else 0
    total+=n
    if live:
        cards.append(f'''      <a class="age-card" href="/nuoi-day-tre/{sec}.html">
        <div class="age-emoji">{EMOJI[sec]}</div>
        <div class="age-body"><h3>{LABEL[sec]}</h3><span class="age-range">{AGE[sec]}</span><p>{n} bài viết</p></div></a>''')
    else:
        cards.append(f'''      <div class="age-card disabled">
        <div class="age-emoji">{EMOJI[sec]}</div>
        <div class="age-body"><h3>{LABEL[sec]}</h3><span class="age-range">{AGE[sec]}</span><p>Sắp ra mắt</p></div></div>''')
STYLE='''*{box-sizing:border-box;margin:0;padding:0}
:root{--green:#7FAD8F;--green-dark:#6a9a76;--green-light:#eaf2ec;--dark:#29303D;--text:#4a5568;--border:#e8eae6}
body{font-family:'Be Vietnam Pro',sans-serif;color:var(--dark);background:#fff;line-height:1.7}
.hero{background:linear-gradient(135deg,#eaf2ec,#dce9e0);padding:50px 20px;text-align:center}
.hero .crumb{font-size:13px;margin-bottom:14px}.hero .crumb a{color:var(--green-dark);text-decoration:none;font-weight:600}
.hero h1{font-family:'Lora',serif;font-size:clamp(30px,4vw,42px)}.hero p{color:var(--text);margin-top:8px}
.container{max-width:1000px;margin:0 auto;padding:40px 20px 60px}
.age-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}
.age-card{display:flex;gap:16px;align-items:center;background:#fff;border:1px solid var(--border);border-radius:16px;padding:20px;text-decoration:none;color:inherit;transition:transform .15s,box-shadow .15s}
.age-card:not(.disabled):hover{transform:translateY(-4px);box-shadow:0 12px 26px rgba(127,173,143,.2)}
.age-card.disabled{opacity:.55}
.age-emoji{font-size:40px;flex:0 0 auto}
.age-body h3{font-family:'Lora',serif;font-size:19px;color:var(--dark)}
.age-range{font-size:12px;color:var(--green-dark);font-weight:600}
.age-body p{font-size:13px;color:var(--text);margin-top:2px}
footer{text-align:center;font-size:12px;color:#9aa3af;border-top:1px solid var(--border);margin-top:48px;padding-top:18px}
footer a{color:var(--green)}'''
page=f'''<!DOCTYPE html>
<html lang="vi"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="canonical" href="{BASE_URL}/nuoi-day-tre.html">
<title>Nuôi dạy trẻ theo độ tuổi - Baby A&M</title>
<meta name="description" content="Cẩm nang nuôi dạy trẻ theo từng độ tuổi: trẻ sơ sinh, em bé, trẻ tập đi và hơn thế nữa - cùng Baby A&M.">
<link rel="icon" href="{FAVICON}">
{FONTS}
<style>
{STYLE}
</style></head>
<body>
<header class="hero">
<div class="crumb"><a href="/index.html">← Quay lại Baby A&M</a></div>
<h1>Nuôi dạy trẻ theo độ tuổi</h1>
<p>Kiến thức chăm sóc & nuôi dạy con qua từng giai đoạn · {total} bài viết</p>
</header>
<main class="container">
    <div class="age-grid">
{chr(10).join(cards)}
    </div>
<footer>
<p>Nội dung dịch & biên tập từ <a href="https://raisingchildren.net.au" target="_blank" rel="noopener">Raising Children Network</a>.</p>
<p>Baby A&M — Chỉ mang tính tham khảo, không thay thế lời khuyên của chuyên gia y tế.</p>
</footer>
</main></body></html>
'''
open(os.path.join(OUT,'nuoi-day-tre.html'),'w',encoding='utf-8').write(page)
print(f'master hub built; live sections total {total} articles')
