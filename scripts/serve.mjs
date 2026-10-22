// Read-only preview server. No filesystem or Git write endpoints.
import http from 'node:http';
import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
const browserTest=process.argv.includes('--browser-test');
const root=await fs.realpath(browserTest?'.local/browser-dist':'dist');const port=browserTest?4175:Number(process.env.PORT||4173);
const types={'.mp4':'video/mp4','.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.pdf':'application/pdf','.csv':'text/csv'};
const server=http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  const boundPort=server.address().port;
  if(req.headers.host!==`127.0.0.1:${boundPort}`&&req.headers.host!==`localhost:${boundPort}`){res.writeHead(403);return res.end();}
  let pathname=decodeURIComponent(new URL(req.url,`http://127.0.0.1:${port}`).pathname);if(pathname.endsWith('/'))pathname+='index.html';
  const file=await fs.realpath(path.join(root,pathname));if(!file.startsWith(root+path.sep))throw Error();
  const stat=await fs.stat(file);if(!stat.isFile())throw Error();
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Accept-Ranges':'bytes'};
  // Safari probes MP4 files with a byte range before loading metadata.
  // Match the live static host and stream files without buffering every video.
  const range=req.method==='GET'&&!req.headers['if-range']&&/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
  let start=0,end=stat.size-1,status=200;
  if(range&&(range[1]||range[2])){
   start=range[1]?Number(range[1]):Math.max(0,stat.size-Number(range[2]));
   end=range[1]&&range[2]?Math.min(Number(range[2]),end):end;
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=stat.size){res.writeHead(416,{...headers,'Content-Range':`bytes */${stat.size}`});return res.end();}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
  }
  res.writeHead(status,{...headers,'Content-Length':Math.max(0,end-start+1)});
  if(req.method==='HEAD'||!stat.size)return res.end();
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Read-only preview: http://127.0.0.1:${server.address().port}/editor/`));
