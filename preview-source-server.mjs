// Local static source snapshot used ONLY by the share-preview browser.
// Served over 127.0.0.1 from the exact ALGO/ART code checked out during
// Render build; users cannot access repository internals or server files.
import {readFile,realpath} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
const root=resolve('preview-site');
const mime={
 '.html':'text/html; charset=utf-8',
 '.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8',
 '.woff2':'font/woff2','.woff':'font/woff',
 '.svg':'image/svg+xml','.png':'image/png',
 '.jpg':'image/jpeg','.jpeg':'image/jpeg'
};
export async function servePreviewSource(req,res,url){
 if(!url.pathname.startsWith('/_preview-source/'))return false;
 const raw=url.pathname.slice('/_preview-source/'.length)||'index.html';
 let name;
 try{name=decodeURIComponent(raw)}catch{
  res.writeHead(400);res.end('Invalid resource');return true;
 }
 const allowed=name==='index.html'||name==='favicon.svg'||
   /^(?:js|css|fonts)\/[A-Za-z0-9_.-]+$/.test(name);
 if(!allowed||!['GET','HEAD'].includes(req.method)){
  res.writeHead(404);res.end('Not found');return true;
 }
 try{
   const disk=await realpath(resolve(root,name));
   if(!disk.startsWith(root+sep)){res.writeHead(403);res.end();return true}
   const bytes=await readFile(disk);
   res.writeHead(200,{
     'content-type':mime[extname(name)]||'application/octet-stream',
     'content-length':bytes.length,
     'cache-control':'public, max-age=1800',
     'x-content-type-options':'nosniff'
   });
   res.end(req.method==='HEAD'?undefined:bytes);
 }catch{
   res.writeHead(404);res.end('Not found');
 }
 return true;
}
