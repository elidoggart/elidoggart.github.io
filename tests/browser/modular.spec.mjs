import {test,expect} from '@playwright/test';
test('rack patches, sequences, saves and restores settings without page errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/arcade/');await page.getByRole('link',{name:'Open modular synthesizer'}).click();await expect(page.locator('.module')).toHaveCount(10);expect(errors,'after navigation').toEqual([]);
 await page.locator('#sequence').click();await expect(page.locator('#sequence')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.pad.active')).toHaveCount(1);await page.locator('#mute').click();await expect(page.locator('#power')).toHaveAttribute('aria-pressed','false');
 await page.getByRole('button',{name:'Wogglebug random output',exact:true}).click();await page.getByRole('button',{name:'Just Friends fm input',exact:true}).click();await expect(page.locator('#count')).toHaveText('8 cables');
 await page.getByText('Edit sequence',{exact:true}).click();await page.getByLabel('Step 1 semitones').fill('17');await page.getByLabel('Step 1 semitones').press('Tab');
 expect(errors,'before download').toEqual([]);const downloadPromise=page.waitForEvent('download');await page.locator('#save').click();const download=await downloadPromise;const path=await download.path();await page.locator('#clear').click();await expect(page.locator('#count')).toHaveText('0 cables');await page.locator('#open').setInputFiles(path);await expect(page.locator('#count')).toHaveText('8 cables');await expect(page.getByLabel('Step 1 semitones')).toHaveValue('17');
 await page.locator('#open').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"cables":[["x","y"]]}')});await expect(page.locator('#status')).toContainText('Could not open');await expect(page.locator('#count')).toHaveText('8 cables');expect(errors).toEqual([]);
});
test('audio graph renders real bounded sound, unpatching silences output, level knob scales envelopes',async({page})=>{
 await page.goto('/arcade/modular.html');const result=await page.evaluate(async()=>{
 const {RackEngine}=await import('/arcade/modular/engine.js');const {initialCables}=await import('/arcade/modular/model.js');
 async function render(cables,level){const c=new OfflineAudioContext(1,44100,44100),e=new RackEngine(c);clearInterval(e.timer);e.patch(cables);e.set('optomix.level1',level);e.envelope();const b=await c.startRendering();let peak=0,sum=0;for(const x of b.getChannelData(0)){peak=Math.max(peak,Math.abs(x));sum+=x*x;}return {peak,rms:Math.sqrt(sum/44100)};}
 return {sound:await render(initialCables,.8),quiet:await render(initialCables,.1),silent:await render([],1)};
 });expect(result.sound.rms).toBeGreaterThan(.001);expect(result.sound.peak).toBeLessThan(1);expect(result.quiet.rms).toBeLessThan(result.sound.rms*.5);expect(result.silent.peak).toBe(0);
});
test('sample grains load and rack stays contained on narrow screens',async({page})=>{
 const {wavBytes}=await import('../../arcade/instrument/dsp.js');await page.goto('/arcade/modular.html');await page.locator('#sample').setInputFiles({name:'tone.wav',mimeType:'audio/wav',buffer:Buffer.from(wavBytes([Float32Array.from({length:44100},(_,i)=>.3*Math.sin(2*Math.PI*220*i/44100))],[1],44100))});await expect(page.locator('#sample-name')).toContainText('tone.wav · 1.0 s');
 await page.locator('#mute').click();for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}await page.setViewportSize({width:1440,height:1000});
});
test('live gate detector triggers an audible envelope and imported grains render',async({page})=>{
 await page.goto('/arcade/modular.html');await page.locator('#power').click();const result=await page.evaluate(async()=>{
 const {RackEngine}=await import('/arcade/modular/engine.js');const {initialCables}=await import('/arcade/modular/model.js');const c=new AudioContext(),e=new RackEngine(c);e.patch(initialCables);await c.resume();e.note(7);await new Promise(r=>setTimeout(r,100));const data=new Float32Array(128);e.analyser.getFloatTimeDomainData(data);const gatePeak=Math.max(...data.map(Math.abs));e.patch([['morph.out','hendrik.in']]);e.buffer=c.createBuffer(1,44100,44100);const b=e.buffer.getChannelData(0);for(let i=0;i<b.length;i++)b[i]=.4*Math.sin(i*2*Math.PI*220/44100);await new Promise(r=>setTimeout(r,180));e.analyser.getFloatTimeDomainData(data);const grainPeak=Math.max(...data.map(Math.abs));await e.close();return {gatePeak,grainPeak};
 });expect(result.gatePeak).toBeGreaterThan(.001);expect(result.grainPeak).toBeGreaterThan(.001);await page.locator('#mute').click();
});
test('all physical jacks and knobs remain individually reachable, with the full touch plate layout',async({page})=>{
 await page.goto('/arcade/modular.html');await page.locator('#cable-toggle').click();await expect(page.locator('.pad')).toHaveCount(10);await expect(page.locator('.transpose-plate')).toHaveCount(2);
 const blocked=await page.locator('.socket,[data-control]').evaluateAll(els=>els.flatMap(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===el||el.contains(hit)?[]:[el.getAttribute('aria-label')];}));expect(blocked).toEqual([]);
 await page.locator('#sequence').click();await expect(page.locator('.pad.active')).toHaveCount(1);await page.locator('#mute').click();
 await page.screenshot({path:'.local/modular-review.png',fullPage:true});await page.goto('/arcade/instrument.html');await page.screenshot({path:'.local/portable-review.png',fullPage:true});
});
