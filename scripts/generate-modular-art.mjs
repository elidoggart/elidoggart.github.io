import fs from 'node:fs/promises';
import {modules} from '../arcade/modular/model.js';
import {layouts} from '../arcade/modular/layout.js';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const svg=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 330"><rect x="35" y="82" width="630" height="166" fill="#efefea" stroke="#999d94"/>'];let left=40;
for(const m of modules){const l=layouts[m.id],w=m.hp*620/104,h=152,top=89,dark=l.tone==='ink',fill=dark?'#f4f5ef':'#fafaf7',ink='#69775c';svg.push(`<g transform="translate(${left} ${top})"><rect width="${w}" height="${h}" fill="${fill}" stroke="#92988b" stroke-width=".5"/>`);
 const point=(x,y)=>[x*w/100,y*h/100];
 for(const b of l.bands||[])svg.push(`<rect x="${b.x*w/100}" y="${b.y*h/100}" width="${b.w*w/100}" height="${b.h*h/100}" fill="none" stroke="#b6c0ab" stroke-width=".4"/>`);
 if(l.tone==='warm')svg.push(`<rect width="${w}" height="8" fill="none" stroke="#c4c9ba" stroke-width=".3"/>`);
 if(m.id!=='touch')svg.push(`<text x="${w/2}" y="6" fill="${ink}" text-anchor="middle" font-family="monospace" font-size="${m.hp<6?2.5:3.3}">${esc(l.title)}</text>`);
 for(const k of l.knobs){const [x,y]=point(k.x,k.y),r=k.size*h/200;svg.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#f2f4eb" stroke="#a1ad95" stroke-width=".5"/><path d="M${x} ${y-r*.75}v${r*.65}" stroke="#859475" stroke-width="1"/>`);}
 for(const p of l.ports){const [x,y]=point(p.x,p.y),r=(m.id==='touch'?2.2:3.4);svg.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#f2f4eb" stroke="#a9b49d" stroke-width=".5"/><circle cx="${x}" cy="${y}" r="${r*.55}" fill="none" stroke="#9ba88e" stroke-width=".4"/>`);}
 for(const b of l.buttons||[]){const [x,y]=point(b.x,b.y);svg.push(`<circle cx="${x}" cy="${y}" r="${b.size*h/200}" fill="${b.colour==='blue'?'#c4d6dc':b.colour==='green'?'#d0ddca':'#dfe6d4'}"/>`);}
 if(l.touch){svg.push(`<text x="${w*.19}" y="${h*.18}" fill="#b47b70" font-family="monospace" font-size="16">48</text>`);for(let i=0;i<12;i++){const row=i%2,col=Math.floor(i/2),x=col===0?w*.015:w*(.175+(col-1)*.164),y=h*(row?.605:.24),ww=col===0?w*.145:w*.151,hh=h*.325;svg.push(`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="#f7f8f2" stroke="#b9c4ab" stroke-width=".5"/>`);for(let j=1;j<14;j++){if(col===0)svg.push(`<path d="M${x+ww*j/14} ${y}v${hh}" stroke="#b0bba2" stroke-width=".6"/>`);else svg.push(`<path d="M${x} ${y+hh*j/14}h${ww}" stroke="#b0bba2" stroke-width=".6"/>`);}}}
 svg.push('</g>');left+=w;
}
svg.push('</svg>');await fs.writeFile('arcade/art/modular.svg',svg.join(''));
