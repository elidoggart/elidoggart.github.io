/* SPDX-License-Identifier: GPL-3.0-or-later */
import {Tape} from './tape.js';
export class Album {
 constructor(rate){this.rate=rate;this.audio=new Tape(rate);this.side=0;this.lengths=[0,0];this.position=0;this.recording=false;this.playing=false;}
 record(){this.stop();this.audio.clear(this.side*2);this.audio.clear(this.side*2+1);this.lengths[this.side]=0;this.position=0;this.recording=true;}
 play(){this.stop();this.position=0;this.playing=this.lengths[this.side]>0;}
 stop(){this.recording=false;this.playing=false;}
 flip(){this.stop();this.side=1-this.side;this.position=0;}
 tick(input){let result=input;if(this.playing){result=[this.audio.at(this.side*2,this.position),this.audio.at(this.side*2+1,this.position)];if(++this.position>=this.lengths[this.side])this.playing=false;}
 else if(this.recording){for(let ch=0;ch<2;ch++)this.audio.write(this.side*2+ch,this.position,input[ch]);this.lengths[this.side]=++this.position;if(this.position>=this.audio.length)this.recording=false;}return result;}
 snapshot(){return {side:this.side,lengths:[...this.lengths],tracks:[0,1,2,3].map(i=>this.audio.slice(i,0,this.lengths[Math.floor(i/2)]))};}
 restore(data){if(!data||data.tracks?.length!==4)return;this.stop();this.audio.load(data.tracks);this.lengths=[0,1].map(i=>Math.min(this.audio.length,data.tracks[i*2].length));this.side=data.side===1?1:0;this.position=0;}
}
