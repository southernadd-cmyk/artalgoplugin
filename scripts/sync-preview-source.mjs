// Bundle ONLY the published ALGO/ART site code and fonts for on-box
// share-image rendering. Do not clone daily gallery images or social media.
// This runs at Render build time, not during a user's share request.
import {spawnSync} from 'node:child_process';
import {existsSync,rmSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve('preview-site');
const source='https://github.com/southernadd-cmyk/algoart.git';
const args=['--depth=1','--filter=blob:none','--sparse','--single-branch',
  '--branch','main',source,root];
if(existsSync(root))rmSync(root,{recursive:true,force:true});
mkdirSync(root,{recursive:true});
function git(params){
 const r=spawnSync('git',params,{encoding:'utf8',timeout:180000,
   maxBuffer:1024*1024});
 if(r.status!==0)throw Error('ALGO/ART preview source sync failed: '+
  params.join(' ')+' / '+r.stderr.slice(-1100));
}
try{
 git(['clone',...args]);
 // Cone mode includes top-level index.html and favicon automatically.
 git(['-C',root,'sparse-checkout','set','--cone','js','css','fonts']);
 for(const file of ['index.html','js/app.js','js/generator.js',
   'js/oil-paint-v1.js','css/style.css']){
   if(!existsSync(resolve(root,file)))
     throw Error('Local ALGO/ART preview source missing '+file);
 }
 const html=readFileSync(resolve(root,'index.html'),'utf8');
 if(!html.includes('social-share.js')||!html.includes('id="art"'))
   throw Error('Synced ALGO/ART page does not contain its real editor renderer');
 console.log('READY: exact ALGO/ART browser code and fonts mirrored locally for image previews');
}catch(error){
 rmSync(root,{recursive:true,force:true});
 throw error;
}
