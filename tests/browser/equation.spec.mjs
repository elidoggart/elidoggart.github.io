import {test,expect} from '@playwright/test';
for(const difficulty of ['easy','medium','hard'])test(`Equation: ${difficulty} completes three rounds and saves total`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/arcade/equation.html?difficulty=${difficulty}`);
 await page.locator('#equation').fill('invalid');await page.locator('#submit').click();await expect(page.locator('.guess-card')).toHaveCount(0);await expect(page.locator('#error')).not.toBeEmpty();
 for(let round=0;round<3;round++){
  for(let guess=0;guess<5;guess++){await page.locator('#equation').fill(String(guess));await page.locator('#submit').click();}
  await expect(page.locator('.guess-card')).toHaveCount(5);await expect(page.locator('#submit')).toBeDisabled();await expect(page.locator('#round-result')).toContainText(' = ');
  await page.locator('.guess-card').first().click();await expect(page.locator('.guess-card').first()).toHaveAttribute('aria-pressed','true');await page.locator('#finish').click();
 }
 await expect(page.locator('#complete')).toBeVisible();await page.locator('#initials').fill('ABC');await page.locator('#save-form button').click();await expect(page.locator('#score-list')).toContainText('ABC');await page.reload();await page.locator('#scores-open').click();await expect(page.locator('#score-list')).toContainText('ABC');expect(errors).toEqual([]);
});
test('Equation: exact fits finish early, invalid guesses do not spend attempts, mobile stays within viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/arcade/equation.html?difficulty=easy');
 await page.locator('#equation').fill('1/0');await page.locator('#submit').click();await expect(page.locator('#remaining')).toHaveText('5 guesses left');
 await page.locator('#equation').fill('0');await page.locator('#submit').click();await page.locator('#finish').click();await expect(page.locator('#round-result')).not.toBeEmpty();await page.locator('#finish').click();
 // Read the engine's equation using deterministic random, then reload with the same seed.
 await page.addInitScript(()=>{Math.random=()=>0;});await page.reload();
 const expression=await page.evaluate(async()=>{const {makeRound}=await import('/arcade/equation-engine.js');return makeRound('easy',()=>0,1).expression;});
 await page.locator('#equation').fill(expression);await page.locator('#submit').click();await expect(page.locator('#submit')).toBeDisabled();await expect(page.locator('.guess-card')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('Equation launches from arcade and shows selected difference below comparison',async({page})=>{
 await page.goto('/arcade/');const card=page.getByRole('article',{name:'Equation launch options'});await card.focus();await card.getByRole('link',{name:'Medium',exact:true}).click();await expect(page).toHaveURL(/difficulty=medium.*play=1/);await expect(page.locator('#difficulty')).toHaveCount(0);await expect(page.locator('#selected-error')).toBeHidden();await page.locator('#equation').fill('x');await page.locator('#submit').click();await expect(page.locator('#selected-error')).toBeVisible();const a=await page.locator('#graph').boundingBox(),b=await page.locator('#error-graph').boundingBox();expect(b.y).toBeGreaterThan(a.y+a.height);await expect(page.getByText('Same domain. Every guess.')).toHaveCount(0);
});
