import {test,expect} from '@playwright/test';
async function openGame(page){
 await page.route('**/still.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.officeTest={game,sync};'});});
 await page.goto('/arcade/still.html?play=1');await page.waitForFunction(()=>window.officeTest);
}
test('walking through cleared exits reaches the elevator, roof jump and helicopter cockpit',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await openGame(page);
 for(let level=0;level<5;level++){
  await expect(page.locator('#field')).toHaveAttribute('data-level',String(level+1));
  await page.evaluate(()=>{const {game:g,sync}=officeTest;g.enemies=[];g.pendingWaves=[];g.step(.01);g.player.x=0;g.player.z=g.room.exit.z-.7;g.player.yaw=0;g.player.pitch=0;sync();});
  await expect(page.locator('#objective')).toContainText(level===3?'RUN + SPACE':'AREA CLEAR');
  await expect(page.locator('#overlay')).toBeHidden();await page.locator('#field').focus();
  await page.keyboard.down('KeyW');if(level===3)await page.keyboard.press('Space');
  if(level===4)await expect(page.locator('body')).toHaveAttribute('data-state','won');
  else await expect(page.locator('#field')).toHaveAttribute('data-level',String(level+2));
  await page.keyboard.up('KeyW');
 }
 await expect(page.locator('#title')).toHaveText('You made it out.');await expect(page.locator('#split-rows tr')).toHaveCount(5);
 const totals=await page.evaluate(()=>{const g=officeTest.game;return {real:g.totalRealTime,world:g.totalTime,splitReal:g.splits.reduce((n,s)=>n+s.real,0),splitWorld:g.splits.reduce((n,s)=>n+s.world,0)};});
 expect(totals.real).toBeCloseTo(totals.splitReal,8);expect(totals.world).toBeCloseTo(totals.splitWorld,8);
 const frozen=await page.locator('#total-real').textContent();await page.keyboard.press('KeyW');expect(await page.locator('#total-real').textContent()).toBe(frozen);expect(errors).toEqual([]);
});
test('mobile finish presents every stage and total without horizontal overflow, and restart clears splits',async({page})=>{
 await page.setViewportSize({width:390,height:844});await openGame(page);
 await page.evaluate(()=>{const {game:g,sync}=officeTest;for(let i=0;i<5;i++){g.enemies=[];g.pendingWaves=[];g.step(.04);Object.assign(g.player,{x:0,z:g.room.exit.z+2,y:2});g.next();}sync();});
 await expect(page.locator('#split-rows tr')).toHaveCount(5);await page.locator('#total-real').scrollIntoViewIfNeeded();await expect(page.locator('#total-real')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#action').click();await expect(page.locator('body')).toHaveAttribute('data-state','playing');await expect(page.locator('#field')).toHaveAttribute('data-level','1');expect(await page.evaluate(()=>officeTest.game.splits.length)).toBe(0);
});
