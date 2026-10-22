import {test,expect} from '@playwright/test';

test('Tanks keyboard controls launch, pause and resume without swallowing button activation',async({page})=>{
 await page.goto('/arcade/tanks.html');
 await page.locator('#action').focus();await page.keyboard.press('Space');
 await expect(page.locator('#field')).toHaveAttribute('data-state','playing');
 await page.keyboard.press('KeyP');await expect(page.locator('#field')).toHaveAttribute('data-state','paused');
 await page.locator('#resume').focus();await page.keyboard.press('Space');
 await expect(page.locator('#field')).toHaveAttribute('data-state','playing');
 await page.locator('#effects-button').focus();const before=await page.locator('#effects-button').getAttribute('aria-pressed');
 await page.keyboard.press('Space');await expect(page.locator('#effects-button')).not.toHaveAttribute('aria-pressed',before);
});

for(const game of ['tanks','still'])test(`${game} leaves paused HUD readouts unchanged between animation frames`,async({page})=>{
 await page.goto(`/arcade/${game}.html?play=1`);
 await expect(page.locator('#field')).toHaveAttribute('data-state','playing');
 await page.keyboard.press('KeyP');await expect(page.locator('#field')).toHaveAttribute('data-state','paused');
 const mutations=await page.evaluate(()=>new Promise(resolve=>{
  let count=0,frames=0;
  const observer=new MutationObserver(records=>count+=records.length);
  for(const id of ['level','lives','score','ammo'])observer.observe(document.getElementById(id),{attributes:true,subtree:true,childList:true,characterData:true});
  function frame(){if(++frames<8){requestAnimationFrame(frame);return;}observer.disconnect();resolve(count);}
  requestAnimationFrame(frame);
 }));
 expect(mutations).toBe(0);
});

test('Tanks instructions pause combat, ignore gameplay keys and close with Escape',async({page})=>{
 await page.goto('/arcade/tanks.html?play=1');await expect(page.locator('#field')).toHaveAttribute('data-state','playing');
 await page.locator('#help-button').click();await expect(page.locator('#manual')).toBeVisible();
 await expect(page.locator('#field')).toHaveAttribute('data-state','paused');
 await page.keyboard.press('KeyP');await expect(page.locator('#field')).toHaveAttribute('data-state','paused');
 await page.keyboard.press('Escape');await expect(page.locator('#manual')).not.toBeVisible();
 await expect(page.locator('#field')).toHaveAttribute('data-state','paused');
 await page.locator('#resume').click();await expect(page.locator('#field')).toHaveAttribute('data-state','playing');
});

test('Still keeps firing while a second touch releases movement',async({browser,browserName,baseURL})=>{
 test.skip(browserName!=='chromium','Simultaneous native touch contacts require the Chromium protocol.');
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();
 try{
  await page.route('**/still.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.touchAudit={get firing(){return fire}};'});});
  await page.goto(new URL('/arcade/still.html?play=1',baseURL).href);await page.waitForFunction(()=>window.touchAudit);
  const fire=await page.locator('#touch-fire').boundingBox(),drive=await page.locator('#drive').boundingBox(),cdp=await context.newCDPSession(page);
  const touches=[{id:1,x:drive.x+drive.width/2,y:drive.y+drive.height/2},{id:2,x:fire.x+fire.width/2,y:fire.y+fire.height/2}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches});
  expect(await page.evaluate(()=>touchAudit.firing)).toBe(true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:touches.slice(0,1)});
  expect(await page.evaluate(()=>touchAudit.firing)).toBe(true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await page.evaluate(()=>touchAudit.firing)).toBe(false);
 }finally{await context.close();}
});
