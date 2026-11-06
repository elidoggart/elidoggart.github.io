// Independent browser interpretation of the ten-module reference rack.
const knob=(id,label,value,min=0,max=1,step=.01)=>({id,label,value,min,max,step});
export const modules=[
 {id:'woggle',name:'Wogglebug',hp:10},
 {id:'ochd',name:'øchd',hp:4},
 {id:'clutch',name:'Clutch',hp:5},
 {id:'propust',name:'Propust',hp:2},
 {id:'friends',name:'Just Friends',hp:14},
 {id:'contour',name:'Contour',hp:8},
 {id:'optomix',name:'Optomix',hp:8},
 {id:'morph',name:'Morphagene',hp:20},
 {id:'touch',name:'Touch Sensing Note Memory',hp:28},
 {id:'hendrik',name:'Hendrikson',hp:5}
];
// Expose the physical panel's complete control and socket arrangement.
const moduleById=Object.fromEntries(modules.map(m=>[m.id,m]));
const extend=(id,knobs,ins,outs)=>Object.assign(moduleById[id],{knobs,ins,outs});
extend('woggle',[knob('depth','EGO / ID',.35),knob('wobble','WOGGLE',.4),knob('speedAmount','SPEED CV',.2),knob('rate','SPEED / CHAOS',2,.1,12,.1)],['ego','influence','speed','clock'],['smoothAudio','ring','woggleAudio','random','smooth','woggle','burst','pulse']);
extend('ochd',[knob('rate','RATE',.3,.02,4,.01),knob('amount','CV',.5,-1,1)],['cv'],Array.from({length:8},(_,i)=>`lfo${i+1}`));
extend('clutch',['','B','C','D'].map((v,i)=>knob('gain'+v,String.fromCharCode(65+i),.4,-1,1)),['in','inB','inC','inD'],['out','outB','outC','outD']);
extend('propust',[],['in','in2','in3'],['high','out','high2','out2','high3','out3']);
extend('friends',[knob('spread','INTONE',.12),knob('pitch','TIME',48,24,84,1),knob('shape','RAMP',.25),knob('fmDepth','FM',.25),knob('curve','CURVE',.5)],['pitch','fm','ramp','run','intone','curve',...Array.from({length:6},(_,i)=>`trig${i+1}`)],['mix',...Array.from({length:6},(_,i)=>`voice${i+1}`)]);
extend('contour',[knob('attack','ONSET',.025,.005,2,.005),knob('sustain','SUSTAIN',.35),knob('decay','DECAY',.45,.05,3,.01),knob('curve','EXP',.5)],['gate','retrigger','decay'],['eon','eoc','env','inverted']);
extend('optomix',[knob('level1','CONTROL',.6),knob('damp','DAMP',.5),knob('level2','CONTROL',.5),knob('damp2','DAMP',.5)],['in1','damp1','cv1','strike1','in2','damp2','cv2','strike2','aux'],['out1','out2','mix']);
extend('morph',[knob('mix','SOS',.5),knob('sizeAmount','− SIZE +',.5,-1,1),knob('slideAmount','− SLIDE +',.5,-1,1),knob('speed','VARISPEED',1,.25,2,.01),knob('size','GENE SIZE',.16,.025,.6,.005),knob('slide','SLIDE',.2),knob('speedAmount','− SPEED +',.5,-1,1),knob('morph','MORPH',.5),knob('organize','ORGANIZE',0)],['in','inR','sos','size','slide','morph','organize','speed','clock','shift','play','record','splice'],['out','outR','cv','eos']);
extend('touch',[knob('tempo','TEMPO',94,35,200,1)],['clock','reset'],['pitch','pressure','gate']);
extend('hendrik',[knob('mix','MIX',.5),knob('volume','OUTPUT',.35),knob('gain','INPUT GAIN',.5)],['in','cv','instrument'],['send','out','headphones']);
const audioPorts=new Set(['woggle.smoothAudio','woggle.ring','woggle.woggleAudio','morph.in','morph.inR','morph.out','morph.outR','friends.mix','hendrik.in','hendrik.instrument','hendrik.send','hendrik.out','hendrik.headphones','optomix.in1','optomix.in2','optomix.out1','optomix.out2','optomix.mix','optomix.aux']);
export const ports=Object.fromEntries(modules.flatMap(m=>['ins','outs'].flatMap(d=>(m[d]||[]).map(p=>[`${m.id}.${p}`,{module:m.id,direction:d==='ins'?'in':'out',type:audioPorts.has(`${m.id}.${p}`)||p.startsWith('voice')||m.id==='clutch'||m.id==='propust'?'audio':'cv'}]))));
export const initialCables=[['friends.mix','optomix.in1'],['touch.pitch','friends.pitch'],['touch.gate','contour.gate'],['contour.env','optomix.cv1'],['optomix.mix','morph.in'],['morph.out','hendrik.in'],['ochd.lfo1','morph.slide']];
export function validateCable(a,b,cables){
 if(!ports[a]||!ports[b])return 'Unknown socket';
 if(ports[a].direction==='in')[a,b]=[b,a];
 if(ports[a].direction!=='out'||ports[b].direction!=='in')return 'Connect an output to an input.';
 if(a===b||ports[a].module===ports[b].module)return 'Choose a different module.';
 if(cables.some(c=>c[0]===a&&c[1]===b))return 'That cable is already connected.';
 if(ports[b].type==='cv'&&ports[a].type!=='cv'&&ports[a].module!=='clutch')return 'This input needs a control voltage.';
 // Acyclic graphs avoid unstable zero-delay feedback and browser-specific failures.
 const edges=cables.map(([x,y])=>[ports[x].module,ports[y].module]);
 const visit=(id,seen=new Set())=>{if(id===ports[a].module)return true;if(seen.has(id))return false;seen.add(id);return edges.filter(e=>e[0]===id).some(e=>visit(e[1],seen));};
 if(visit(ports[b].module))return 'Feedback loops are not supported.';
 return [a,b];
}
export const defaultNotes=[0,2,4,5,7,9,11,12,14,16];
export function parsePatch(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.cables)||raw.cables.length>100)throw Error('Not a rack patch.');
 const cables=[];for(const c of raw.cables){if(!Array.isArray(c)||c.length!==2)throw Error('Invalid cable');const result=validateCable(...c,cables);if(typeof result==='string')throw Error(result);cables.push(result);}
 const values={};for(const m of modules)for(const k of m.knobs){const v=raw.values?.[`${m.id}.${k.id}`]??k.value;if(!Number.isFinite(v)||v<k.min||v>k.max)throw Error('Invalid control value');values[`${m.id}.${k.id}`]=v;}
 if(!Array.isArray(raw.notes)||raw.notes.length!==10||raw.notes.some(n=>!Number.isInteger(n)||n<0||n>24))throw Error('Invalid notes');
 return {version:1,cables,values,notes:raw.notes};
}
