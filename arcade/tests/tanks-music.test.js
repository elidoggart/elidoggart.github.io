import test from 'node:test';
import assert from 'node:assert/strict';
import {musicLayers,TankMusic,PARTS} from '../tanks-music.js';
const tank=(type,id=1)=>({id,type,alive:true});
const signatures={sentry:['snare','bassDrum'],patrol:['metronome','harmony'],rocket:['timpaniA','horns'],hunter:['counterFife','cymbals'],miner:['bells','triangle'],warrior:['timpaniB','horns','rolls'],sniper:['clarinet','harmony'],stealth:['synth','counterFife','triangle'],elite:['horns','clarinet','bells','cymbals','rolls','harmony']};
for(const [type,parts] of Object.entries(signatures))for(let count=1;count<=8;count++)test(`${type}, ${count} tanks retain their instrument layers`,()=>{
 const layers=musicLayers(Array.from({length:count},(_,i)=>tank(type,i+1)));
 for(const part of ['piccolo','snare','bassDrum','tuba',...parts])assert(layers.includes(part));
 assert.equal(new Set(layers).size,layers.length);
 if(count>=2)assert(layers.includes('harmony'));
 if(count>=3)assert(layers.includes('rolls'));
 if(count>=4)assert(layers.includes('cymbals'));
});
test('mixed armies combine every tank type; destruction removes only unsupported parts',()=>{
 const tanks=[tank('miner'),tank('stealth',2),tank('rocket',3)];
 assert(musicLayers(tanks).includes('bells'));assert(musicLayers(tanks).includes('synth'));assert(musicLayers(tanks).includes('horns'));
 tanks[1].alive=false;
 assert(!musicLayers(tanks).includes('synth'));assert(musicLayers(tanks).includes('bells'));assert(musicLayers(tanks).includes('horns'));
 assert.deepEqual(musicLayers([...tanks].reverse()),musicLayers(tanks));
 assert.deepEqual(musicLayers([tank('elite',0),{...tank('elite'),alive:false}]),[]);
});
test('full army uses all sixteen layers and every layer has scheduled notes',()=>{
 const layers=musicLayers(Object.keys(signatures).map((t,i)=>tank(t,i+1)));
 assert.deepEqual(layers,PARTS);
 const music=new TankMusic(),heard=new Set();music.note=part=>heard.add(part);
 for(let i=0;i<256;i++)music.beat(i,1+i*.15);
 for(const part of PARTS)assert(heard.has(part),part);
});
test('Road to Boston has thirty-two complete AABB bars and sustained notes',async()=>{
 const {MELODY}=await import('../tanks-music.js');
 assert.equal(MELODY.length,256);
 assert.equal(MELODY.filter(Boolean).reduce((n,[,duration])=>n+duration,0),256);
 assert.deepEqual(MELODY.slice(0,8),[[78,4],null,null,null,[78,2],null,[76,1],[78,1]]);
});

test('fife carries the melody from the first level at a lively tempo',async()=>{
 const {TankMusic,TEMPO}=await import('../tanks-music.js');
 assert.equal(TEMPO,112);
 const music=new TankMusic(),notes=[];
 music.note=(...args)=>notes.push(args);
 music.beat(0,1);
 assert(notes.some(([part,voice])=>part==='piccolo'&&voice==='fife'));
 assert(!notes.some(([,voice])=>voice==='piccolo'));
});

test('starting a mission starts the melody immediately without a snare count-in',async()=>{
 const {TankMusic}=await import('../tanks-music.js');
 const music=new TankMusic(),cues=[];
 music.enabled=true;music.context={currentTime:10};music.state='ready';
 music.layers=musicLayers([tank('sentry')]);music.cue=kind=>cues.push(kind);music.schedule=()=>{};
 try{
  music.update({state:'playing',level:0,lives:3,tanks:[{id:1,alive:true,type:'sentry'}]});
  assert.equal(music.next,10.04);assert.equal(music.step,0);
  assert.deepEqual(cues,[]);
 }finally{music.stop();}
});
