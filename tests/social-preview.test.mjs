import assert from 'node:assert/strict';
import test from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {makeSharePreviewHandler,sharePreviewTest} from '../share-preview.mjs';
const keys=sharePreviewTest.keys;
const input={v:'9',seed:'ART-20261015-%PHI-7',mode:'organic',fmt:'portrait',
 pal:'earth',paper:'#283f57',material:'oil-v1',sheet:'phi',el:'54',den:'62'};
const token=Buffer.from(keys.map(k=>input[k]||'').join('\x1f')).toString('base64url');
function mockBrowser(){
 return async()=>({newPage:async()=>({
    goto:async(url)=>assert(url.startsWith('https://southernadd-cmyk.github.io/algoart/?c=')),
    waitForFunction:async(fn,seed)=>assert.equal(seed,input.seed),
    evaluate:async()=>Buffer.from([0xff,0xd8,0xff,0xd9]).toString('base64'),
    close:async()=>{}
 })});
}
let server;let origin;
test.before(async()=>{
 const handler=makeSharePreviewHandler({browser:mockBrowser()});
 server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  handler(req,res,url).catch(err=>{res.writeHead(500);res.end(String(err))});
 });
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 origin='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
test('exact browser compact token parses without losing seed, material, colour or orientation',()=>{
 const values=sharePreviewTest.canonicalToken(token);
 assert.equal(values.seed,input.seed);
 assert.equal(values.material,'oil-v1');
 assert.equal(values.pal,'earth');
 assert.equal(values.paper,'#283f57');
 assert.equal(values.fmt,'portrait');
 assert.equal(values.sheet,'phi');
 assert.equal(sharePreviewTest.canonicalToken(token.slice(1)),null);
 assert.equal(sharePreviewTest.canonicalToken('not-valid!'),null);
});
test('server HTML exposes real crawler-visible artwork-specific card and click-through',async()=>{
 const r=await fetch(origin+'/share?c='+encodeURIComponent(token));
 assert.equal(r.status,200);
 const html=await r.text();
 assert.match(html,/property="og:image"/);
 assert.match(html,/\/share\/image\?c=/);
 assert.match(html,/name="twitter:image"/);
 assert.match(html,/Oil Paint/);
 assert.match(html,/ART-20261015-%PHI-7/);
 assert.match(html,/location\.replace\(/);
 assert(!html.includes('social-card.png'));
 const head=await fetch(origin+'/share?c='+token,{method:'HEAD'});
 assert.equal(head.status,200);
 assert.equal(await head.text(),'');
});
test('OG image uses the exact real-engine share token and image/jpeg bytes',async()=>{
 const r=await fetch(origin+'/share/image?c='+token);
 assert.equal(r.status,200);
 assert.match(r.headers.get('content-type'),/image\/jpeg/);
 const buffer=Buffer.from(await r.arrayBuffer());
 assert.equal(buffer[0],0xff);
 assert.equal(buffer[1],0xd8);
 const r2=await fetch(origin+'/share/image?c='+token);
 assert.equal(r2.status,200);
 assert.deepEqual(await r2.arrayBuffer(),new Uint8Array(buffer).buffer);
});
test('reject invalid and hostile tokens without browser renders or network calls',async()=>{
 for(const token of ['bad!','',{not:'x'}.not,Buffer.from(
  ['9','<script>','spiral'].concat(keys.slice(3).map(()=>'')).join('\x1f')
 ).toString('base64url')]){
  const bad=await fetch(origin+'/share?c='+encodeURIComponent(token||''));
  assert.equal(bad.status,400);
 }
});
