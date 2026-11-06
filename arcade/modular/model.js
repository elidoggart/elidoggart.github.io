// Independent browser interpretation of the ten-module reference rack.
const knob=(id,label,value,min=0,max=1,step=.01)=>({id,label,value,min,max,step});
export const modules=[
 {id:'woggle',name:'Wogglebug',hp:10,role:'Random voltage',knobs:[knob('rate','Rate',2,.1,12,.1),knob('depth','Depth',.35)],outs:['random','pulse']},
 {id:'ochd',name:'øchd',hp:4,role:'Eight LFOs',knobs:[knob('rate','Rate',.3,.02,4,.01)],outs:Array.from({length:8},(_,i)=>`lfo${i+1}`)},
 {id:'clutch',name:'Clutch',hp:5,role:'Attenuator',knobs:[knob('gain','Level',.4,-1,1)],ins:['in'],outs:['out']},
 {id:'propust',name:'Propust',hp:2,role:'Low pass',knobs:[knob('cutoff','Cut',3500,80,12000,10)],ins:['in'],outs:['out']},
 {id:'friends',name:'Just Friends',hp:14,role:'Six voices',knobs:[knob('pitch','Pitch',48,24,84,1),knob('spread','Intone',.12),knob('shape','Shape',.25)],ins:['pitch','fm'],outs:['mix','voice1','voice2','voice3','voice4','voice5','voice6']},
 {id:'contour',name:'Contour',hp:8,role:'Envelope',knobs:[knob('attack','Onset',.025,.005,2,.005),knob('decay','Decay',.45,.05,3,.01),knob('sustain','Sustain',.35)],ins:['gate'],outs:['env']},
 {id:'optomix',name:'Optomix',hp:8,role:'Dual low-pass gate',knobs:[knob('level1','Control 1',.6),knob('level2','Control 2',.5),knob('damp','Damp',.5)],ins:['in1','cv1','in2','cv2'],outs:['out1','out2','mix']},
 {id:'morph',name:'Morphagene',hp:20,role:'Tape & grains',knobs:[knob('size','Gene size',.16,.025,.6,.005),knob('slide','Slide',.2),knob('speed','Varispeed',1,.25,2,.01),knob('morph','Morph',.5)],ins:['in','slide'],outs:['out']},
 {id:'touch',name:'Touch Sensing Note Memory',hp:28,role:'Touch & sequence',knobs:[knob('tempo','Tempo',94,35,200,1)],outs:['pitch','gate']},
 {id:'hendrik',name:'Hendrikson',hp:5,role:'Output',knobs:[knob('volume','Volume',.35)],ins:['in'],outs:[]}
];
export const ports=Object.fromEntries(modules.flatMap(m=>['ins','outs'].flatMap(d=>(m[d]||[]).map(p=>[`${m.id}.${p}`,{module:m.id,direction:d==='ins'?'in':'out',type: ['pitch','fm','gate','env','random','pulse','slide','cv1','cv2'].includes(p)||p.startsWith('lfo')?'cv':'audio'}]))));
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
export const defaultNotes=[0,7,12,3,10,7,5,3];
export function parsePatch(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.cables)||raw.cables.length>100)throw Error('Not a rack patch.');
 const cables=[];for(const c of raw.cables){if(!Array.isArray(c)||c.length!==2)throw Error('Invalid cable');const result=validateCable(...c,cables);if(typeof result==='string')throw Error(result);cables.push(result);}
 const values={};for(const m of modules)for(const k of m.knobs){const v=raw.values?.[`${m.id}.${k.id}`]??k.value;if(!Number.isFinite(v)||v<k.min||v>k.max)throw Error('Invalid control value');values[`${m.id}.${k.id}`]=v;}
 if(!Array.isArray(raw.notes)||raw.notes.length!==8||raw.notes.some(n=>!Number.isInteger(n)||n<0||n>24))throw Error('Invalid notes');
 return {version:1,cables,values,notes:raw.notes};
}
