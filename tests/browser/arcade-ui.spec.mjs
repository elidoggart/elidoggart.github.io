import {test,expect} from '@playwright/test';

const games=['space','tanks','still','equation'];
for(const game of games)test(`${game}: Escape dismisses instructions without starting portfolio navigation`,async({page})=>{
 await page.goto(`/arcade/${game}.html`);
 const help=page.locator(game==='equation'?'#help-open':'#help-button');
 const dialog=page.locator(game==='equation'?'#help':'#manual');
 await help.click();await expect(dialog).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 await expect(page.locator('.portfolio-return')).not.toHaveClass(/holding/);
 await expect(page).toHaveURL(new RegExp(`/arcade/${game}\\.html$`));
});

test.describe('touch controls and shared navigation',()=>{
 test.use({hasTouch:true});
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:844,height:390}])test(`all arcade controls fit ${viewport.width}×${viewport.height}`,async({page})=>{
  await page.setViewportSize(viewport);
  for(const game of games){
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`/arcade/${game}.html`);
   for(const link of ['Return to arcade','Return to portfolio'])await expect(page.getByRole('link',{name:link,exact:true})).toBeInViewport();
   const controls=page.locator('.game-tools button');
   for(const button of await controls.all()){
    const box=await button.boundingBox();
    expect(box.x,`${game} ${await button.textContent()} left`).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y+box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.height).toBeGreaterThanOrEqual(viewport.height<500?36:44);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(game!=='equation'){
    await page.goto(`/arcade/${game}.html?play=1&difficulty=easy`);
    await page.locator(game==='space'?'#pause-button':'#pause').click();
    const tools=await page.locator('.game-tools').evaluate(el=>{
     const buttons=[...el.querySelectorAll('button')];return {height:el.getBoundingClientRect().height,buttonHeight:buttons[0].getBoundingClientRect().height,right:el.getBoundingClientRect().right};
    });
    expect(tools.height,`${game} paused toolbar stays on one line`).toBe(tools.buttonHeight);
    expect(tools.right).toBeLessThanOrEqual(viewport.width);
   }
   expect(errors).toEqual([]);
  }
 });
});

test('audio controls show their state and keep accessible mute actions and independent volume',async({page})=>{
 for(const game of ['space','tanks','still']){
  await page.goto(`/arcade/${game}.html`);
  const effects=page.getByRole('button',{name:'Unmute effects',exact:true});
  const music=page.getByRole('button',{name:'Unmute music',exact:true});
  await expect(effects).toHaveText('Effects off');await expect(music).toHaveText('Music off');
  const initialEffects=await effects.getAttribute('data-volume'),initialMusic=await music.getAttribute('data-volume');
  await effects.focus();await page.keyboard.press('ArrowDown');
  await expect(effects).toHaveAttribute('data-volume',String(Number(initialEffects)-5));
  await expect(music).toHaveAttribute('data-volume',initialMusic);
  await effects.click();await expect(page.getByRole('button',{name:'Mute effects',exact:true})).toHaveText('Effects on');
  await expect(page.locator('#effects-button')).toHaveAttribute('aria-pressed','true');
 }
});

test('Tanks pause actions share the same size and typography',async({page})=>{
 await page.goto('/arcade/tanks.html?play=1');await page.locator('#pause').click();
 const controls=await page.locator('#resume,#restart-run,#highscores-button,#exit-game').evaluateAll(buttons=>buttons.map(button=>{
  const box=button.getBoundingClientRect(),style=getComputedStyle(button);return {width:box.width,height:box.height,font:style.font};
 }));
 for(const control of controls)expect(control).toEqual(controls[0]);
});
