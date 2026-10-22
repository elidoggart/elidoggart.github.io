import {test,expect} from '@playwright/test';
async function openGame(page){
 await page.route('**/still.js?*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.officeTest={game,sync,renderer};'});});
 await page.goto('/arcade/still.html?play=1');await page.waitForFunction(()=>window.officeTest);
}
test('walking through cleared exits reaches the elevator, roof boarding and helicopter cockpit',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await openGame(page);
 for(let level=0;level<5;level++){
  await expect(page.locator('#field')).toHaveAttribute('data-level',String(level+1));
  await page.evaluate(()=>{const {game:g,sync}=officeTest;g.enemies=[];g.pendingWaves=[];g.step(.01);g.player.x=0;g.player.z=g.room.exit.z-.7;g.player.yaw=0;g.player.pitch=0;sync();});
  expect(await page.evaluate(()=>officeTest.game.exitUnlocked)).toBe(true);
  await expect(page.locator('#objective,.chapter,#remaining,#touch-jump')).toHaveCount(0);
  await expect(page.locator('#overlay')).toBeHidden();await page.locator('#field').focus();
  await page.keyboard.down('KeyW');
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
 await page.evaluate(()=>{const {game:g,sync}=officeTest;for(let i=0;i<5;i++){g.enemies=[];g.pendingWaves=[];g.step(.04);Object.assign(g.player,{x:0,z:g.room.exit.z+g.room.exit.travel+.06,y:1.5});g.next();}sync();});
 await expect(page.locator('#split-rows tr')).toHaveCount(5);await page.locator('#total-real').scrollIntoViewIfNeeded();await expect(page.locator('#total-real')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#action').click();await expect(page.locator('body')).toHaveAttribute('data-state','playing');await expect(page.locator('#field')).toHaveAttribute('data-level','1');expect(await page.evaluate(()=>officeTest.game.splits.length)).toBe(0);
});

test('opening combat chains a throwable, a timed pistol pickup and an incoming wave',async({page})=>{
 await openGame(page);await page.locator('#field').focus();
 await page.keyboard.press('KeyE');
 await expect.poll(()=>page.evaluate(()=>officeTest.game.player.held)).toBe('bottle');
 await page.evaluate(()=>{const g=officeTest.game,e=g.enemies[0];g.player.yaw=Math.atan2(e.x-g.player.x,e.z-g.player.z);});
 await expect.poll(()=>page.evaluate(()=>officeTest.game.player.cool)).toBe(0);
 await page.keyboard.press('KeyQ');
 await expect.poll(()=>page.evaluate(()=>officeTest.game.enemies[0].alive)).toBe(false);
 expect(await page.evaluate(()=>officeTest.game.wave)).toBe(0);
 await page.evaluate(()=>officeTest.game.player.yaw=0);
 // The engine caps simulation steps at 50ms. Walk to observable positions,
 // since a fixed wall-clock hold covers less ground on slower renderers.
 await page.keyboard.down('KeyD');
 try{await page.waitForFunction(()=>officeTest.game.player.x>=1.7);}finally{await page.keyboard.up('KeyD');}
 await page.keyboard.down('KeyW');
 try{await page.waitForFunction(()=>{
  const g=officeTest.game,item=g.nearbyItem();
  return item?.id==='enemy-0'&&Math.hypot(item.x-g.player.x,item.z-g.player.z)<2;
 });}finally{await page.keyboard.up('KeyW');}
 await page.evaluate(()=>{const g=officeTest.game,item=g.items.find(i=>i.id==='enemy-0');g.player.yaw=Math.atan2(item.x-g.player.x,item.z-g.player.z);});
 await page.keyboard.press('KeyE');
 await expect.poll(()=>page.evaluate(()=>officeTest.game.player.held)).toBe('gun');
 expect(await page.evaluate(()=>officeTest.game.player.ammo)).toBe(1);
 await expect.poll(()=>page.evaluate(()=>officeTest.game.wave)).toBe(1);
 expect(await page.evaluate(()=>officeTest.game.enemies[1].alive)).toBe(true);
 expect(await page.evaluate(()=>officeTest.game.exitUnlocked)).toBe(false);
 await expect(page.locator('#ammo')).toContainText('1/3');
});

test('distinct rooms, terminal and cockpit render without runtime errors',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await openGame(page);
 await page.evaluate(()=>officeTest.game.step=()=>{});
 for(let level=0;level<5;level++){
  await page.evaluate(level=>{const {game:g,sync,renderer}=officeTest;g.mode='hard';g.level=level;g.previousRoom=null;g.loadRoom();g.state='playing';if(level===4){g.exitUnlocked=true;Object.assign(g.player,{x:0,z:5.1,yaw:0});}sync();renderer.draw(g);},level);
  await page.screenshot({path:`.local/still-refined-stage-${level+1}.png`});
  const ink=await page.locator('#field').evaluate(c=>{const d=c.getContext('2d').getImageData(c.width*.1,c.height*.15,c.width*.8,c.height*.5).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]<150)n++;return n;});
  expect(ink,`room ${level+1} has visible scenery above the held weapon`).toBeGreaterThan(500);
 }
 expect(errors).toEqual([]);
});

test('room geometry remains visually continuous while crossing each connected doorway',async({page})=>{
 await openGame(page);await page.evaluate(()=>officeTest.game.step=()=>{});
 const changes=await page.evaluate(()=>{
  const {game:g,renderer}=officeTest,reports=[];
  for(let level=0;level<4;level++){
   g.level=level;g.previousRoom=null;g.loadRoom();g.enemies=[];g.pendingWaves=[];g.exitUnlocked=true;
   Object.assign(g.player,{x:0,z:g.room.exit.z+g.room.exit.travel+.06,yaw:0,pitch:0,held:'gun',ammo:2});
   renderer.draw(g);const ctx=renderer.ctx,c=renderer.canvas,before=ctx.getImageData(0,0,c.width,c.height).data;
   g.next();renderer.draw(g);const after=ctx.getImageData(0,0,c.width,c.height).data;
   let changed=0;for(let i=0;i<before.length;i+=4)if(Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2])>120)changed++;
   reports.push({level,fraction:changed/(c.width*c.height),weapon:g.player.held,ammo:g.player.ammo});
  }return reports;
 });
 for(const r of changes){expect(r.fraction,`doorway ${r.level+1}`).toBeLessThan(.035);expect(r.weapon).toBe('gun');expect(r.ammo).toBe(2);}
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`expanded playfield fits ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await openGame(page);
 await expect(page.locator('.chapter,#remaining,#touch-jump')).toHaveCount(0);
 const rect=await page.locator('#field').boundingBox(),main=await page.locator('main').boundingBox();
 expect(rect.height).toBeGreaterThan(viewport.height*.55);
 expect(Math.abs(rect.height-main.height)).toBeLessThan(3);
 expect(rect.y+rect.height).toBeLessThanOrEqual(viewport.height);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const before=await page.evaluate(()=>officeTest.game.player.y);await page.locator('#field').focus();await page.keyboard.press('Space');expect(await page.evaluate(()=>officeTest.game.player.y)).toBe(before);
 if(viewport.width===390)await page.screenshot({path:'.local/still-refined-mobile.png'});
});
