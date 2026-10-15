// Real public HTTP unfurl diagnostic. Unlike local Playwright tests, this
// simulates Threads and Bluesky fetches hitting the deployed Render URL.
// The source site is not mocked. No writes and no social posts.
import {Buffer} from 'node:buffer';
const keys=[
 'v','seed','mode','fmt','el','den','cx','neg','phi','rec','spi','ga','nest',
 'pen','th','wob','od','op','pr','dry','curve','shape','overlap','rot',
 'ln','ci','re','po','ar','pal','cols','sat','bri','paper','grain',
 'sheet','material','fit','tissue','watercolor'
];
const values={v:'9',seed:'UNFURL-20261016-TEST',mode:'spiral',
 fmt:'landscape',el:'36',den:'64',phi:'83',pal:'earth',paper:'#f5f0e6',material:'oil-v1'};
const token=Buffer.from(keys.map(k=>values[k]||'').join('\x1f'),'utf8').toString('base64url');
const service='https://algoart-composition-plugin.onrender.com';
const pages=[
 ['Threads',service+'/share?c='+token+'&pv=2',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'],
 ['Bluesky',service+'/share?c='+token,
  'Mozilla/5.0 (compatible; BlueskyCardyb/1.0; +https://bsky.app)'],
 ['Generic browser',service+'/share?c='+token,'Mozilla/5.0']
];
let failed=0;
for(const [platform,url,ua] of pages){
 const st=Date.now();
 try{
  const page=await fetch(url,{
    headers:{'user-agent':ua,'accept':'text/html,application/xhtml+xml'},
    redirect:'manual',signal:AbortSignal.timeout(75000)});
  const html=await page.text();
  const match=html.match(/<meta property="og:image" content="([^"]+)"/);
  const card=match?.[1].replaceAll('&amp;','&');
  console.log(platform,'PAGE',page.status,'ms',Date.now()-st,
    'redirect',page.headers.get('location'),'content-type',page.headers.get('content-type'),
    'OG',card?.slice(0,110));
  if(page.status!==200||!card){failed++;continue}
  const start=Date.now();
  const response=await fetch(card,{headers:{'user-agent':ua,'accept':'image/avif,image/webp,image/*,*/*'},
    signal:AbortSignal.timeout(90000),redirect:'manual'});
  const buffer=Buffer.from(await response.arrayBuffer());
  const good=response.status===200&&response.headers.get('content-type')?.includes('image/jpeg')&&
    buffer.length>14000&&buffer[0]===0xff&&buffer[1]===0xd8;
  console.log(platform,'IMAGE',response.status,'ms',Date.now()-start,
    'bytes',buffer.length,'type',response.headers.get('content-type'),
    'cache',response.headers.get('cache-control'),'valid',!!good,
    'bodyOnFail',good?'':buffer.toString('utf8').slice(0,250));
  if(!good||Date.now()-start>10000)failed++;
 }catch(err){failed++;console.error(platform,'FAILED',err.toString().slice(0,300),'ms',Date.now()-st)}
}
if(failed){console.error('RESULT FAILED',failed,'social unfurl checks');process.exitCode=1}
else console.log('RESULT PASS: all three independent real-world image unfurl requests succeed');
