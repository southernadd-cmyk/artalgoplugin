// End-to-end: serve build-mirrored actual ALGO/ART source locally, run the
// real browser engine, and deliver a valid art-specific JPEG to a crawler.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright';
import {makeSharePreviewHandler,sharePreviewTest} from '../share-preview.mjs';
import {servePreviewSource} from '../preview-source-server.mjs';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
assert(existsSync('preview-site/preview-fast.html'), 'Drawing-only page must exist');
assert(existsSync('preview-site/js/oil-paint-v1.js'),
  'postinstall must sync actual Oil engine source before testing');
const seed='OG-LOCAL-RENDER-20261016';
const values={v:'9',seed,mode:'spiral',fmt:'landscape',
  material:'oil-v1',pal:'earth',paper:'#f5f0e6',
  el:'35',den:'48',phi:'85',neg:'55'};
const token=Buffer.from(
  sharePreviewTest.keys.map(k=>values[k]||'').join('\x1f'),'utf8'
).toString('base64url');
let server,browser,url;
test.before(async()=>{
 browser=await chromium.launch({headless:true,args:['--no-sandbox',
   '--disable-dev-shm-usage']});
 const bundledFileURL=pathToFileURL(resolve('preview-site/preview-fast.html')).href;
 // Preview Chromium loads the real browser engine from local disk; no
 // navigation to GitHub Pages or back into Render's HTTP listener.
 server=createServer(async(req,res)=>{
  const requestURL=new URL(req.url||'/', 'http://127.0.0.1');
  try{
   if(await servePreviewSource(req,res,requestURL))return;
   const handler=makeSharePreviewHandler({browser:async()=>browser,
     source:bundledFileURL});
   await handler(req,res,requestURL);
  }catch(e){if(!res.headersSent)res.writeHead(500);res.end(String(e))}
 });
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 url='http://127.0.0.1:'+server.address().port;

});
test.after(async()=>{
 if(browser)await browser.close();
 if(server)await new Promise(resolve=>server.close(resolve));
});
test('mirrored local site serves exact source without external Pages requests',async()=>{
 const h=await fetch(url+'/_preview-source/index.html');
 assert.equal(h.status,200);assert.match(await h.text(),/id="art"/);
 const oil=await fetch(url+'/_preview-source/js/oil-paint-v1.js');
 assert.equal(oil.status,200);
 const contents=await oil.text();
 assert.match(contents,/renderOilPaintV1/);
 const privateFile=await fetch(url+'/_preview-source/.git/config');
 assert.equal(privateFile.status,404);
});
test('real Oil canvas renders reliable image/jpeg via local-origin Chromium', {
 timeout:180000
},async()=>{
 const href=url+'/share/image?c='+encodeURIComponent(token)+'&pv=2';
 const t=Date.now();
 const r=await fetch(href,{signal:AbortSignal.timeout(160000)});
 assert.equal(r.status,200,'Actual ALGO/ART art image must not be 503 or 404');
 assert.match(r.headers.get('content-type')||'',/image\/jpeg/);
 const body=Buffer.from(await r.arrayBuffer());
 assert(body.length>12000,'JPEG too small for actual full-render oil painting');
 assert.equal(body[0],255);assert.equal(body[1],216);
 assert.equal(body[body.length-2],255);assert.equal(body[body.length-1],217);
 const r2=await fetch(href);
 assert.equal(r2.status,200,'Cached image should stay reliably accessible');
 assert.deepEqual(Buffer.from(await r2.arrayBuffer()),body);

 const preload=url+'/share/preload?c='+encodeURIComponent(token);
 const bad=await fetch(preload,{method:'POST',headers:{'origin':'https://evil.example',
   'content-type':'application/json'},body:JSON.stringify({jpeg:body.toString('base64')})});
 assert.equal(bad.status,403,'Only ALGO/ART public editor may preload');
 const upload=await fetch(preload,{
   method:'POST',headers:{'origin':'https://southernadd-cmyk.github.io',
    'content-type':'application/json'},
   body:JSON.stringify({jpeg:body.toString('base64')})
 });
 assert.equal(upload.status,200,'Real artwork JPEG should preload into social cache');
 const cachedAt=Date.now();
 const cached=await fetch(href,{headers:{'user-agent':'facebookexternalhit/1.1'}});
 assert.equal(cached.status,200);
 assert.deepEqual(Buffer.from(await cached.arrayBuffer()),body,
   'Social scraper did not retrieve the exact preloaded artwork bytes');
 assert(Date.now()-cachedAt<1500,'Preloaded card must respond immediately to scrapers');
 console.log('PASS exact oil art share preview JPEG from local browser source:',{
  length:body.length,renderMs:Date.now()-t});
});
