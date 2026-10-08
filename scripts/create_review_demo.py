#!/usr/bin/env python3
"""Build a truthful video demonstration from calls to the LIVE ALGO/ART MCP server.
This is not an in-ChatGPT end-to-end recording; it shows live backend behavior.
"""
import base64, hashlib, io, json, os, subprocess, textwrap, time, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

URL="https://algoart-composition-plugin.onrender.com/mcp"
OUT=Path("demo-build")
OUT.mkdir(exist_ok=True)
def call(name, arguments):
    payload=json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":name,"arguments":arguments}}).encode()
    req=urllib.request.Request(URL,data=payload,headers={"Content-Type":"application/json","Accept":"application/json, text/event-stream"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=180) as res:
                body=json.load(res)
            return body.get("result",body)
        except Exception as ex:
            if attempt==2:raise
            print("Retry",name,attempt+1,type(ex).__name__,flush=True)
            time.sleep(8)
def png(data):
    return Image.open(io.BytesIO(base64.b64decode(data.split(",")[-1]))).convert("RGB")
def font(n,bold=False):
    path="/usr/share/fonts/truetype/dejavu/DejaVuSans"+("-Bold" if bold else "")+".ttf"
    return ImageFont.truetype(path,n)
W,H=1280,720
black="#11110f";white="#f7f5ef";lime="#d9ff54";orange="#ff6138"
titlefont=font(40,True);headfont=font(28,True);bodyfont=font(24);smallfont=font(19);tinyfont=font(16)
slides=[]
def board(kicker,title,subtitle="",footnote="LIVE MCP BACKEND DEMONSTRATION — NOT AN IN-CHATGPT RECORDING"):
    im=Image.new("RGB",(W,H),white);d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,18),fill=orange)
    d.rectangle((0,18,W,92),fill=black)
    d.text((42,39),"ALGO/ART  /  COMPOSITION",font=headfont,fill=lime)
    d.text((42,119),kicker.upper(),font=smallfont,fill=orange)
    d.text((42,159),title,font=titlefont,fill=black)
    for i,line in enumerate(textwrap.wrap(subtitle,80)):
        d.text((44,219+i*32),line,font=smallfont,fill="#555")
    d.line((42,H-61,W-42,H-61),fill="#bbb",width=1)
    d.text((42,H-47),footnote,font=tinyfont,fill="#555")
    return im,d
def add(im,dur):
    i=len(slides);path=OUT/f"{i:02d}.png";im.save(path);slides.append((path,dur))
intro,d=board("Original algorithms • reproducible guides","Golden-ratio composition inside ChatGPT","Automated walkthrough of live, independently tested MCP tools. All composition PNGs in this recording come from the original ALGO/ART V6 renderer.")
d.text((60,350),"Eight original modes   •   Three previews   •   Selected 1400×1000 PNG",font=headfont,fill=black)
d.text((60,431),"Source: southernadd-cmyk.github.io/algoart/",font=bodyfont,fill="#555")
add(intro,5)
def triple(subject,label,mode=None):
    opts={"subject":subject}
    if mode: opts["mode"]=mode
    r=call("show_composition_picker",opts)
    guides=r.get("structuredContent",{}).get("guides",[])
    assert len(guides)==3 and all(g.get("preview","").startswith("data:image/png;base64,") for g in guides)
    im,d=board(label,"Three ORIGINAL ALGO/ART compositions",subject)
    for i,g in enumerate(guides):
        px=png(g["preview"]);px.thumbnail((361,255))
        x=54+i*403
        card=Image.new("RGB",(370,302),"white")
        card.paste(px,((370-px.width)//2,7))
        im.paste(card,(x,309))
        d.rectangle((x,309,x+370,611),outline="#999",width=2)
        d.text((x+14,581),f"{g['title']} · {g['mode']}",font=smallfont,fill=black)
    add(im,7)
    return guides
fridge=triple("An oil painting of a fridge full of food","POSITIVE TEST 1 / STILL LIFE")
gothic=triple("A gothic scene with people in modern streetwear","POSITIVE TEST 2 / GOTHIC")
spiral=triple("A painting of a woodland","POSITIVE TEST 3 / SPIRAL",mode="spiral")
assert all(g["mode"]=="spiral" for g in spiral)
chosen={"mode":"geometric","seed":"CHAT-DEBUG-007","subject":"A fridge full of food"}
ref=call("get_composition_guide",chosen)
image=next(x for x in ref.get("content",[]) if x.get("type")=="image")
full=png(image["data"]);assert full.size==(1400,1000)
im,d=board("POSITIVE TEST 4 / SELECTED REFERENCE","The exact full-resolution PNG","get_composition_guide(mode=geometric, seed=CHAT-DEBUG-007)")
p=full.copy();p.thumbnail((670,460))
im.paste(p,(55,290));d.rectangle((53,288,57+p.width,292+p.height),outline=black,width=2)
d.text((785,324),"1400 × 1000 pixels",font=headfont,fill=black)
d.text((785,385),"Returned as image/png",font=bodyfont,fill="#444")
d.text((785,451),"Use as spatial blueprint.",font=smallfont,fill="#444")
d.text((785,487),"Preserve negative space.",font=smallfont,fill="#444")
add(im,7)
ref2=call("get_composition_guide",chosen)
image2=next(x for x in ref2.get("content",[]) if x.get("type")=="image")
same=hashlib.sha256(base64.b64decode(image["data"])).hexdigest()==hashlib.sha256(base64.b64decode(image2["data"])).hexdigest()
assert same, "Original renderer failed determinism test"
im,d=board("POSITIVE TEST 5 / REPRODUCIBILITY","The same seed reproduces the same PNG","Two independent calls to the original composition renderer.")
d.text((64,354),"SHA-256 IMAGE DIGESTS",font=headfont,fill=black)
digest=hashlib.sha256(base64.b64decode(image["data"])).hexdigest()
d.text((64,417),digest,font=smallfont,fill="#444")
d.text((64,495),"MATCH: EXACTLY IDENTICAL PNG BYTES",font=headfont,fill="#117b49")
add(im,5)
invalid=call("get_composition_guide",{"mode":"not-a-mode","seed":"X"})
assert invalid.get("isError") or invalid.get("content", [{}])[0].get("type")=="text" or invalid.get("error"),"Unsupported mode unexpectedly accepted"
im,d=board("NEGATIVE TESTS / SAFETY","Unsupported requests are not executed","Plugin provides composition guides only; it cannot publish to external accounts or promise exact image-generation fidelity.")
d.text((65,350),"1. Unknown algorithm: schema rejects the mode",font=bodyfont,fill=black)
d.text((65,408),"2. Social-media posting: no tool or account access",font=bodyfont,fill=black)
d.text((65,466),"3. Pixel-perfect ChatGPT output: not guaranteed",font=bodyfont,fill=black)
add(im,7)
im,d=board("SUBMISSION DEMONSTRATION / SCOPE","Working MCP server; final image step untested","This recording demonstrates the actual live ALGO/ART MCP tools and original PNG outputs, NOT a ChatGPT user session or native image generation.")
d.text((65,363),"3 preview guides  •  Full PNG  •  Deterministic output",font=headfont,fill=black)
d.text((65,432),"Remaining: ChatGPT picker and image handoff test",font=bodyfont,fill="#b34718")
add(im,6)
concat=OUT/"input.txt"
with concat.open("w") as fp:
    for path,duration in slides:fp.write(f"file '{path.name}'\nduration {duration}\n")
    fp.write(f"file '{slides[-1][0].name}'\n")
video=Path("algoart-composition-review-demo.mp4")
subprocess.run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(concat),"-vf","fps=24,format=yuv420p","-c:v","libx264","-preset","fast","-crf","24","-movflags","+faststart",str(video)],check=True)
print(json.dumps({"slides":len(slides),"duration_seconds":sum(t for _,t in slides),"bytes":video.stat().st_size,"sha256":hashlib.sha256(video.read_bytes()).hexdigest(),"preview_modes":[g["mode"] for g in fridge],"deterministic":same}),flush=True)
