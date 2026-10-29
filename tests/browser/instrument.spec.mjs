import {test,expect} from '@playwright/test';

test('instrument plays chords, releases notes, records and exports real audio',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/arcade/instrument.html');
 await page.keyboard.down('z');await page.keyboard.down('c');await page.keyboard.down('b');await expect(page.locator('.key.active')).toHaveCount(3);await expect(page.locator('#audio-status')).toContainText('Audio on');await expect(page.locator('#screen-meter')).not.toHaveText('−∞ dB');
 await page.keyboard.up('z');await page.keyboard.up('c');await page.keyboard.up('b');await expect(page.locator('.key.active')).toHaveCount(0);
 await page.keyboard.press('Enter');await expect(page.locator('#record')).toHaveAttribute('aria-pressed','true');await page.keyboard.down('z');await page.waitForTimeout(350);await page.keyboard.up('z');await page.keyboard.press('Enter');await expect(page.locator('#record')).toHaveAttribute('aria-pressed','false');await page.keyboard.press('Backspace');
 await page.getByRole('button',{name:'Tape F3'}).click();const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;const stream=await d.createReadStream();const chunks=[];for await(const c of stream)chunks.push(c);const bytes=Buffer.concat(chunks);expect(bytes.toString('ascii',0,4)).toBe('RIFF');expect(bytes.length).toBeGreaterThan(100000);expect(bytes.subarray(44).some(x=>x!==0)).toBe(true);
 await page.locator('#help-open').click();await expect(page.locator('#help')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#help')).not.toBeVisible();expect(errors).toEqual([]);
});
test('instrument holds and clears keys, changes engines, and keeps narrow viewports contained',async({page})=>{
 await page.goto('/arcade/instrument.html');await page.locator('#hold').click();await page.keyboard.press('z');await expect(page.locator('.key.active')).toHaveCount(1);await page.locator('#panic').click();await expect(page.locator('.key.active')).toHaveCount(0);
 await page.locator('#engine').selectOption('saw');await expect(page.locator('#screen-mode')).toContainText('DETUNED SAW');
 for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const el of await page.locator('.knob,.key').all()){const box=await el.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);}}
});
test('sampler imports local audio and the arcade links to the instrument',async({page})=>{
 const {wavBytes}=await import('../../arcade/instrument/dsp.js');
 await page.goto('/arcade/');await page.getByRole('article',{name:'Instrument launch options'}).focus();await page.getByRole('link',{name:'Play instrument'}).click();await expect(page).toHaveURL(/instrument.html$/);
 await page.locator('#engine').selectOption('sample');await page.locator('#sample-file').setInputFiles({name:'test-tone.wav',mimeType:'audio/wav',buffer:Buffer.from(wavBytes([Float32Array.from({length:44100},(_,i)=>.4*Math.sin(2*Math.PI*261.63*i/44100))],[1],44100))});
 await expect(page.locator('#message')).toContainText('Loaded 1.0 s');await page.locator('#display').click();await page.keyboard.down('z');await expect(page.locator('#screen-meter')).not.toHaveText('−∞ dB');await page.keyboard.up('z');await expect(page.locator('.key.active')).toHaveCount(0);
});
test('device face contains only hardware controls; browser labels stay outside',async({page})=>{
 await page.goto('/arcade/instrument.html');
 await expect(page.locator('.instrument .key')).toHaveCount(24);await expect(page.locator('.instrument .knob')).toHaveCount(4);await expect(page.locator('.instrument input,.instrument select,.instrument .key-label,.instrument .note-label')).toHaveCount(0);await expect(page.locator('.companion #knobs input')).toHaveCount(4);await expect(page.locator('.companion .map-key')).toHaveCount(24);
 await page.getByRole('button',{name:'Preset 3 · Warm saw',exact:true}).click();await expect(page.locator('#screen-mode')).toContainText('DETUNED SAW');await page.getByRole('button',{name:'Tape F3',exact:true}).click();await page.getByRole('button',{name:'Effect / track 3',exact:true}).click();await expect(page.locator('.track').nth(2)).toHaveClass(/selected/);
 await page.getByRole('button',{name:'Synth F1',exact:true}).click();await page.getByRole('button',{name:'Envelope / track 2',exact:true}).click();await expect(page.getByLabel('Attack',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Engine / track 1',exact:true}).click();await page.screenshot({path:'.local/instrument-preview.png',fullPage:true});
});
test('tutorial: Pattern drums, separate synth memory, tape layers and stereo export',async({page})=>{
 await page.goto('/arcade/instrument.html');await page.locator('#tempo').fill('120');await page.locator('#bars').selectOption('1');await page.getByRole('button',{name:'Drum F2',exact:true}).click();await page.locator('#device-sequence').click();
 for(const step of [1,5,9,13]){await page.getByRole('button',{name:`Step ${step}`,exact:true}).click();await page.keyboard.press('Shift+z');}
 await page.getByRole('button',{name:'Tape F3',exact:true}).click();await expect(page.locator('#tape-panel')).toContainText('0:02.00');await page.locator('#record').click();await expect(page.locator('#screen-detail')).toContainText('ARM');await page.keyboard.down('b');await page.waitForTimeout(550);await page.keyboard.up('b');await page.locator('#stop').click();await expect(page.locator('.track').nth(0)).toContainText('1 take');
 await page.getByRole('button',{name:'Synth F1',exact:true}).click();await page.locator('#device-sequence').click();await expect(page.locator('#sequence-type')).toHaveValue('endless');await expect(page.locator('#sequence-steps .filled')).toHaveCount(0);await page.locator('#sequence-enabled').click();await page.getByRole('button',{name:'Tape F3',exact:true}).click();await page.getByRole('button',{name:'Envelope / track 2',exact:true}).click();await page.locator('#rewind').click();await page.locator('#record').click();await page.keyboard.down('b');await page.waitForTimeout(350);await page.keyboard.up('b');await page.locator('#stop').click();await expect(page.locator('.track').nth(1)).toContainText('1 take');
 const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download;const stream=await d.createReadStream();const chunks=[];for await(const c of stream)chunks.push(c);const bytes=Buffer.concat(chunks);expect(bytes.readUInt16LE(22)).toBe(2);expect(bytes.subarray(44).some(x=>x!==0)).toBe(true);
 await page.getByRole('button',{name:'Drum F2',exact:true}).click();await page.locator('#device-sequence').click();await expect(page.locator('#sequence-type')).toHaveValue('pattern');await expect(page.locator('#sequence-steps .filled')).toHaveCount(4);
});
