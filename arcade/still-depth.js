// Opaque surfaces and wire edges share a depth buffer. Face order must never
// decide whether an enemy, wall, or piece of furniture is visible.
export class StillDepth {
 constructor(canvas){
  this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:true});
  if(!gl)throw Error('WebGL unavailable');
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s};
  const vertex=shader(gl.VERTEX_SHADER,'attribute vec4 position; attribute vec4 color; varying lowp vec4 tint; void main(){gl_Position=position;tint=color;}');
  const fragment=shader(gl.FRAGMENT_SHADER,'precision mediump float; varying lowp vec4 tint; void main(){gl_FragColor=tint;}');
  const program=this.program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.deleteShader(vertex);gl.deleteShader(fragment);
  this.buffer=gl.createBuffer();this.position=gl.getAttribLocation(program,'position');this.color=gl.getAttribLocation(program,'color');this.colors=new Map();
 }
 rgba(color){if(this.colors.has(color))return this.colors.get(color);const hex=color==='white'?'ffffff':color.replace('#','');const value=hex.length===3?hex.split('').map(c=>c+c).join(''):hex;const out=[parseInt(value.slice(0,2),16)/255,parseInt(value.slice(2,4),16)/255,parseInt(value.slice(4,6),16)/255,1];this.colors.set(color,out);return out;}
 draw(faces,w,h,f,dpr){
  const gl=this.gl,near=.08,far=150,clip=p=>[2*f/w*p[0],2*f/h*p[1]+.06*p[2],(far+near)/(far-near)*p[2]-2*far*near/(far-near),p[2]],fills=[],edges=[];
  const vertex=(list,p,color)=>list.push(...p,...color);
  const line=(a,b,color,width)=>{
   const dx=(b[0]/b[3]-a[0]/a[3])*w,dy=(b[1]/b[3]-a[1]/a[3])*h,length=Math.hypot(dx,dy);if(length<.0001)return;
   const nx=-dy/length*width/w,ny=dx/length*width/h;
   const shift=(p,sign)=>[p[0]+nx*p[3]*sign,p[1]+ny*p[3]*sign,p[2],p[3]];
   const v=[shift(a,-1),shift(b,-1),shift(b,1),shift(a,1)];for(const i of [0,1,2,0,2,3])vertex(edges,v[i],color);
  };
  for(const face of faces){if(!face.camera)continue;const q=face.camera.map(clip);
   if(face.fill){const color=this.rgba(face.fill);for(let i=1;i<q.length-1;i++)for(const p of [q[0],q[i],q[i+1]])vertex(fills,p,color);}
   const color=this.rgba(face.color),count=face.fill?q.length:q.length-1;
   for(let i=0;i<count;i++){
    const a=q[i],b=q[(i+1)%q.length];
    if(face.dashed){const distance=Math.hypot((b[0]/b[3]-a[0]/a[3])*w/2,(b[1]/b[3]-a[1]/a[3])*h/2),steps=Math.min(256,Math.max(1,Math.ceil(distance/11)));
     // Interpolate in camera space to preserve the same depth along each dash.
     for(let j=0;j<steps;j++){const mix=t=>a.map((v,k)=>v+(b[k]-v)*t);line(mix(j/steps),mix(Math.min(1,(j+.38)/steps)),color,face.width||1);}
    }else line(a,b,color,face.width||1);
   }
  }
  const pw=Math.max(1,Math.round(w*dpr)),ph=Math.max(1,Math.round(h*dpr));if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph;}
  gl.viewport(0,0,pw,ph);gl.clearColor(1,1,1,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.useProgram(this.program);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(this.position);gl.enableVertexAttribArray(this.color);gl.vertexAttribPointer(this.position,4,gl.FLOAT,false,32,0);gl.vertexAttribPointer(this.color,4,gl.FLOAT,false,32,16);
  const draw=data=>{gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,data.length/8);};
  gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);draw(fills);gl.disable(gl.POLYGON_OFFSET_FILL);
  // Edges test against surfaces but do not occlude each other at intersections.
  gl.depthMask(false);draw(edges);gl.depthMask(true);
 }
}
