import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {render} from '../../lib/render.mjs';
const current=JSON.parse(fs.readFileSync('content/portfolio.json')).portfolio;

async function actualPortfolio(page){
 await page.route('**/review-portfolio.html',route=>route.fulfill({contentType:'text/html',body:render(current)}));
}

test('initial portfolio load defers hidden photos and video until their section opens',async({page})=>{
 await actualPortfolio(page);
 const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
 await page.goto('/review-portfolio.html');
 await page.evaluate(()=>document.fonts.ready);
 const workPicture=page.locator('#view-work .entry-photo img').first();
 // Content edits may remove every photo; publication must still be testable.
 if(await workPicture.count())await expect(workPicture).toHaveJSProperty('complete',true);
 await page.waitForTimeout(300);
 const hiddenOnly=await page.evaluate(()=>{
  const visibleSources=new Set([...document.images].filter(image=>!image.closest('[hidden]')).map(image=>new URL(image.src).pathname));
  return [...document.images].filter(image=>image.closest('[hidden]')&&!visibleSources.has(new URL(image.src).pathname)).map(image=>new URL(image.src).pathname);
 });
 await expect(page.locator('main video source[src]')).toHaveCount(0);
 expect(requests.filter(url=>url.endsWith('.mp4'))).toEqual([]);
 expect(requests.filter(url=>hiddenOnly.includes(url))).toEqual([]);
 await page.locator('nav [data-section="passions"]').click();
 const picture=page.locator('#view-passions .entry-photo img').first();
 if(await picture.count()){
  await picture.scrollIntoViewIfNeeded();await expect(picture).toHaveJSProperty('complete',true);
  expect(await picture.evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
 }
});

test('project videos load on disclosure and pause when collapsed or navigating away',async({page})=>{
 await actualPortfolio(page);await page.goto('/review-portfolio.html');
 const video=page.locator('main video').first();
 test.skip(await video.count()===0,'The current portfolio has no videos; its content and navigation are still checked below.');
 const source=video.locator('source').first(),videoURL=await source.getAttribute('data-src');
 expect(videoURL).toBeTruthy();await expect(source).not.toHaveAttribute('src');
 const {section,role}=await video.evaluate(video=>({section:video.closest('[data-view]').dataset.view,role:video.closest('.entry-details').id.replace('details-','')}));
 await page.locator(`nav [data-section="${section}"]`).click();
 await expect(source).not.toHaveAttribute('src');
 await page.locator(`[data-expand="${role}"]`).click();
 await expect(video).toBeVisible();await expect(video).toHaveAttribute('preload','metadata');
 await expect(source).toHaveAttribute('src',videoURL);
 await expect(source).not.toHaveAttribute('data-src');
 await video.evaluate(video=>video.play());await expect(video).toHaveJSProperty('paused',false);
 await page.locator(`[data-collapse="${role}"]`).click();await expect(video).toHaveJSProperty('paused',true);
 const position=await video.evaluate(video=>video.currentTime);
 await page.locator(`[data-expand="${role}"]`).click();
 expect(await video.evaluate(video=>video.currentTime)).toBeCloseTo(position,2);
 await video.evaluate(video=>video.play());
 await page.locator('nav [data-section="contact"]').click();await expect(video).toHaveJSProperty('paused',true);
});

test('actual portfolio entries, assets and mobile sections remain usable',async({page})=>{
 await actualPortfolio(page);const errors=[],missing=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)missing.push(response.url());});
 await page.goto('/review-portfolio.html');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const section of ['work','projects','skills','passions','contact']){
   if(await page.locator('#section-select').isVisible())await page.locator('#section-select').selectOption(section);
   else await page.locator(`nav [data-section="${section}"]`).click();
   const buttons=page.locator(`#view-${section} [data-expand]`);
   for(const button of await buttons.all())if(await button.getAttribute('aria-expanded')==='false')await button.click();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${section} at ${width}px`).toBe(true);
  }
 }
 expect(errors).toEqual([]);expect(missing).toEqual([]);
});
