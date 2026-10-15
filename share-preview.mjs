// SSR Open Graph preview for arbitrary exact ALGO/ART artworks. Lives on
// the EXISTING composition-plugin web service; MCP routes are untouched.
// Server-side metadata (not JS-inserted), so social crawlers see the actual
// shared artwork image rather than the generic ALGO/ART social-card.png.
const SITE='https://southernadd-cmyk.github.io/algoart/';
const PUBLIC='https://algoart-composition-plugin.onrender.com';
const KEYS=[
 'v','seed','mode','fmt','el','den','cx','neg','phi','rec','spi','ga','nest',
 'pen','th','wob','od','op','pr','dry','curve','shape','overlap','rot',
 'ln','ci','re','po','ar','pal','cols','sat','bri','paper','grain',
 'sheet','material','fit','tissue','watercolor'
];
const MODES={field:'Orbital Studies',spiral:'Golden Trajectories',
 rects:'Recursive Divisions',burst:'Radiant Systems',network:'Connected Fields',
 organic:'Growth Systems',geometric:'Constructed Forms',scribble:'Automatic Marks'};
const MATERIALS={'oil-v1':'Oil Paint','watercolour-v2s':'Watercolour',
 'watercolour-v2r':'Watercolour',tissue:'Tissue & Graphite'};
const cache=new Map();
const LIMIT=64;
const MAX_ACTIVE=2;
let active=0;
const pending=[];
function safe(text){return String(text).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);}
function canonicalToken(raw){
 if(typeof raw!=='string'||raw.length>1500||raw.length<10||
    !/^[A-Za-z0-9_-]+$/.test(raw))return null;
 try{
   const bytes=Buffer.from(raw,'base64url');
   if(bytes.toString('base64url')!==raw)return null;
   const parts=new TextDecoder('utf-8',{fatal:true}).decode(bytes)
      .split('\x1f');
   if(parts.length!==KEYS.length||parts.some(x=>x.length>250)||
       !/^[5-9]$/.test(parts[0])||!parts[1]||parts[1].length>80||
       !MODES[parts[2]]||
       (parts[3]&&!['portrait','landscape'].includes(parts[3])))return null;
   const values={};
   KEYS.forEach((k,i)=>{values[k]=parts[i]});
   // Screen out raw URL control characters, headers and tags.
   if(parts.some(x=>/[\u0000-\u001e\u007f<>]/u.test(x)))return null;
   return values;
 }catch(e){return null}
}
function metaFor(token,data){
 const title='ALGO/ART — '+MODES[data.mode]+' · '+data.seed;
 const material=MATERIALS[data.material]||
   (data.tissue?'Tissue & Graphite':'Marker drawing');
 const description='Original '+material+' composition by ALGO/ART. Seed '+
   data.seed+'. Open the exact artwork, explore its golden-ratio structure and remix.';
 const url=PUBLIC+'/share?c='+encodeURIComponent(token);
 const image=PUBLIC+'/share/image?c='+encodeURIComponent(token);
 const redirect=SITE+'?c='+encodeURIComponent(token);
 return {title,description,url,image,redirect};
}
function htmlFor(token,data){
 const m=metaFor(token,data),e=safe;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
   '<meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<title>'+e(m.title)+'</title>'+
   '<meta name="description" content="'+e(m.description)+'">'+
   '<meta property="og:type" content="website">'+
   '<meta property="og:site_name" content="ALGO/ART">'+
   '<meta property="og:title" content="'+e(m.title)+'">'+
   '<meta property="og:description" content="'+e(m.description)+'">'+
   '<meta property="og:url" content="'+e(m.url)+'">'+
   '<meta property="og:image" content="'+e(m.image)+'">'+
   '<meta property="og:image:secure_url" content="'+e(m.image)+'">'+
   '<meta property="og:image:type" content="image/jpeg">'+
   '<meta property="og:image:width" content="1200">'+
   '<meta property="og:image:height" content="630">'+
   '<meta name="twitter:card" content="summary_large_image">'+
   '<meta name="twitter:title" content="'+e(m.title)+'">'+
   '<meta name="twitter:description" content="'+e(m.description)+'">'+
   '<meta name="twitter:image" content="'+e(m.image)+'">'+
   '<meta http-equiv="refresh" content="1;url='+e(m.redirect)+'">'+
   '</head><body style="margin:2rem;background:#f5f0e6;font-family:monospace">'+
   '<h1>ALGO/ART · YOUR ARTWORK</h1><p>Opening the exact artwork…</p>'+
   '<a href="'+e(m.redirect)+'">OPEN ARTWORK</a>'+
   '<script>location.replace('+JSON.stringify(m.redirect)+')</script>'+
   '</body></html>';
}
async function limit(fn){
 if(active>=MAX_ACTIVE){
   if(pending.length>10)throw Error('Social preview renderer is busy');
   await new Promise((resolve,reject)=>pending.push({resolve,reject}));
 }
 active++;
 try{return await fn()}finally{
   active--;
   const next=pending.shift();
   if(next)next.resolve();
 }
}
async function imageFor(token,data,browser,source=SITE){
 const found=cache.get(token);
 if(found){cache.delete(token);cache.set(token,found);return found}
 const bytes=await limit(async()=>{
   const b=await browser();
   const page=await b.newPage({viewport:{width:1440,height:1000},
      deviceScaleFactor:1});
   try{
     // This is a trusted fixed origin, never a user-supplied URL.
     await page.goto(source+'?c='+encodeURIComponent(token),
       {waitUntil:'domcontentloaded',timeout:60000});
     await page.waitForFunction(seed=>
       document.querySelector('#seed')?.value===seed&&
       document.querySelector('#art')?.width>=1000&&
       document.querySelector('#statsText')?.textContent?.includes(seed),
       data.seed,{timeout:70000});
     // Page script executes real ALGO/ART browser engine with exactly
     // the original material/seed/palette/paper, not a stock screenshot.
     return Buffer.from(await page.evaluate(()=>{
       const src=document.querySelector('#art');
       const dest=document.createElement('canvas');
       dest.width=1200;dest.height=630;
       const ctx=dest.getContext('2d');
       ctx.fillStyle='#f5f0e6';ctx.fillRect(0,0,1200,630);
       const scale=Math.min(1200/src.width,630/src.height);
       const w=src.width*scale,h=src.height*scale;
       ctx.drawImage(src,(1200-w)/2,(630-h)/2,w,h);
       return dest.toDataURL('image/jpeg',.86).split(',')[1];
     }), 'base64');
   }finally{await page.close()}
 });
 cache.set(token,bytes);
 if(cache.size>LIMIT)cache.delete(cache.keys().next().value);
 return bytes;
}
export function makeSharePreviewHandler({browser,source=SITE}){
 return async function sharePreview(req,res,url){
   if(req.method!=='GET'&&req.method!=='HEAD'){
     res.writeHead(405,{'allow':'GET, HEAD'});res.end();return;
   }
   const token=url.searchParams.get('c');
   const data=canonicalToken(token);
   if(!data){
     res.writeHead(400,{'content-type':'text/plain; charset=utf-8',
       'cache-control':'no-store'});res.end('Invalid artwork link');return;
   }
   if(url.pathname==='/share'){
     res.writeHead(200,{'content-type':'text/html; charset=utf-8',
       'cache-control':'public, max-age=1800','x-content-type-options':'nosniff'});
     res.end(req.method==='HEAD'?'':htmlFor(token,data));return;
   }
   if(url.pathname==='/share/image'){
     if(req.method==='HEAD'){
       res.writeHead(200,{'content-type':'image/jpeg',
         'cache-control':'public, max-age=86400'});res.end();return;
     }
     try{
       const bytes=await imageFor(token,data,browser,source);
       res.writeHead(200,{'content-type':'image/jpeg',
         'content-length':bytes.length,
         'cache-control':'public, max-age=86400, stale-while-revalidate=3600',
         'x-content-type-options':'nosniff'});
       res.end(bytes);
     }catch(error){
       console.error('ALGO/ART social card image rendering error:',error);
       res.writeHead(503,{'content-type':'text/plain; charset=utf-8',
         'cache-control':'no-store'});
       res.end('Artwork preview temporarily unavailable');
     }
   }
 };
}
export const sharePreviewTest={canonicalToken,metaFor,htmlFor,keys:KEYS};
