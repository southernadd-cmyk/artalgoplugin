// Real public Render preload route: verifies cross-origin CORS, secure upload,
// and fast crawler GET of original JPEG before either share composer opens.
import {Buffer} from 'node:buffer';
const keys=['v','seed','mode','fmt','el','den','cx','neg','phi','rec','spi','ga','nest','pen','th','wob','od','op','pr','dry','curve','shape','overlap','rot','ln','ci','re','po','ar','pal','cols','sat','bri','paper','grain','sheet','material','fit','tissue','watercolor'];
function tokenFor(seed){
 return Buffer.from(keys.map(k=>({
  v:'9',seed,mode:'spiral',fmt:'landscape',el:'36',den:'64',
  phi:'83',pal:'earth',paper:'#f5f0e6',material:'oil-v1'
 })[k]||'').join('\x1f')).toString('base64url');
}
const base='https://algoart-composition-plugin.onrender.com';
const origin='https://southernadd-cmyk.github.io';
const source=tokenFor('PRELOAD-SOURCE-20261016');
const start=Date.now();
const sourceResponse=await fetch(base+'/share/image?c='+source,{
 signal:AbortSignal.timeout(80000)});
const body=Buffer.from(await sourceResponse.arrayBuffer());
if(sourceResponse.status!==200||body.length<15000)throw Error('Cannot get real image source: '+sourceResponse.status);
console.log('Real Oil source JPEG:',body.length,'bytes, renderMs',Date.now()-start);
const sample=tokenFor('PRELOADED-CRAWLER-20261016');
const url=base+'/share/preload?c='+sample;
const preflight=await fetch(url,{method:'OPTIONS',headers:{
 'Origin':origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
console.log('CORS preflight:',preflight.status,preflight.headers.get('access-control-allow-origin'));
if(preflight.status!==204||preflight.headers.get('access-control-allow-origin')!==origin)
 throw Error('Real browser CORS preflight would fail');
const bad=await fetch(url,{method:'POST',headers:{'Origin':'https://attacker.example',
 'content-type':'application/json'},body:JSON.stringify({jpeg:body.toString('base64')})});
if(bad.status!==403)throw Error('Unauthorized image upload not rejected '+bad.status);
const upload=await fetch(url,{method:'POST',headers:{
 'Origin':origin,'Content-Type':'application/json'},
 body:JSON.stringify({jpeg:body.toString('base64')})});
console.log('Preload:',upload.status,await upload.text());
if(upload.status!==200)throw Error('Preload failed');
for(const [service,agent] of [
 ['Meta','facebookexternalhit/1.1'],
 ['Bluesky','Mozilla/5.0 (compatible; BlueskyCardyb/1.0)']]){
 const t=Date.now();
 const r=await fetch(base+'/share/image?c='+sample+'&pv=2',
  {headers:{'user-agent':agent},signal:AbortSignal.timeout(15000)});
 const bytes=Buffer.from(await r.arrayBuffer()),ms=Date.now()-t;
 console.log(service,'cached image',r.status,bytes.length,ms+'ms');
 if(r.status!==200||!bytes.equals(body)||ms>3000)throw Error(service+' image not served immediately');
}
console.log('PASS real public preload + immediate Meta and Bluesky fetch');
