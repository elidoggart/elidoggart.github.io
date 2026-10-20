import {test,expect} from '@playwright/test';
for(const difficulty of ['easy','medium','hard'])test(`Equation: ${difficulty} completes three rounds and saves total`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/arcade/equation.html?difficulty=${difficulty}`);
 await page.locator('#equation').fill('invalid');await page.locator('#submit').click();await expect(page.locator('.guess-card')).toHaveCount(0);await expect(page.locator('#error')).not.toBeEmpty();
 for(let round=0;round<3;round++){
  for(let guess=0;guess<5;guess++){await page.locator('#equation').fill(String(guess/2));await page.locator('#submit').click();}
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
test('Equation launches from arcade with a large target and paired guess graphs',async({page})=>{
 await page.goto('/arcade/');const card=page.getByRole('article',{name:'Equation launch options'});await card.focus();await card.getByRole('link',{name:'Medium',exact:true}).click();await expect(page).toHaveURL(/difficulty=medium.*play=1/);await expect(page.locator('#difficulty')).toHaveCount(0);await expect(page.locator('#selected-error')).toHaveCount(0);const before=await page.locator('#graph').boundingBox();await page.locator('#equation').fill('x');await page.locator('#submit').click();await expect(page.locator('.guess-card .difference')).toBeVisible();await expect(page.locator('.guess-card .comparison')).toHaveCount(1);const after=await page.locator('#graph').boundingBox();expect(after).toEqual(before);await expect(page.getByText('Same domain. Every guess.')).toHaveCount(0);
});
test('hints halve one round, guess graphs are paired and square, and total summarizes all rounds',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>0;performance.now=()=>1000;});await page.goto('/arcade/equation.html?difficulty=easy');
 await page.locator('#show-hint').click();await expect(page.locator('#hint')).toContainText('Quadratic');await expect(page.locator('.hint-formula')).toHaveText('a(x − h)² + k');expect(await page.locator('#help-open').evaluate(el=>!el.closest('.workspace'))).toBe(true);await expect(page.locator('#show-hint')).toBeDisabled();await expect(page.locator('#remaining')).toHaveText('5 guesses left');
 const expression=await page.evaluate(async()=>{const {makeRound}=await import('/arcade/equation-engine.js');return makeRound('easy',()=>0,1).expression;});await page.locator('#equation').fill(expression);await page.locator('#submit').click();await expect(page.locator('#total')).toContainText('5,000');await expect(page.locator('.guess-card canvas')).toHaveCount(2);
 for(const selector of ['#graph','.guess-card .comparison','.guess-card .difference']){const box=await page.locator(selector).boundingBox();expect(Math.abs(box.width-box.height)).toBeLessThan(1);}
 await page.locator('#finish').click();await expect(page.locator('#hint')).toBeEmpty();await expect(page.locator('#show-hint')).toBeEnabled();
 for(let i=0;i<2;i++){await page.locator('#equation').fill('0');await page.locator('#submit').click();await page.locator('#finish').click();await page.locator('#finish').click();}
 await expect(page.locator('.round-summary')).toHaveCount(3);expect(await page.locator('#complete').evaluate(el=>el.scrollTop)).toBe(0);for(const selector of ['#final-score','#save-form button','#again']){const box=await page.locator(selector).boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(844);}await expect(page.locator('#session-summary')).toContainText('3 guesses');await expect(page.locator('#session-summary')).toContainText('1 hint');await expect(page.locator('.summary-penalty').first()).toHaveText('Hint used · 10,000 × ½ = 5,000');await expect(page.locator('.summary-penalty').nth(1)).toHaveText('No hint');await expect(page.locator('.round-summary canvas')).toHaveCount(6);await page.locator('.round-summary summary').first().click();await expect(page.locator('.round-summary ol').first()).toContainText('best');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const box=await page.locator('.round-summary .comparison').first().boundingBox();expect(Math.abs(box.width-box.height)).toBeLessThan(1);
});

for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844},{width:375,height:667},{width:844,height:390}])test(`Equation stays fixed with scrolling history at ${viewport.width}x${viewport.height}`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/arcade/equation.html?difficulty=hard');
 const before=await page.locator('.workspace').boundingBox();await page.locator('#show-hint').click();
 for(let i=0;i<5;i++){await page.locator('#equation').fill(String(i/2));await page.locator('#submit').click();}
 const after=await page.locator('.workspace').boundingBox();expect(after).toEqual(before);
 for(const sel of ['#graph','#guess-form','#finish','#show-hint','#help-open','#round-result']){const b=await page.locator(sel).boundingBox();expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.height).toBeLessThanOrEqual(viewport.height);expect(b.width).toBeGreaterThan(0);}
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);expect(await page.evaluate(()=>scrollY)).toBe(0);
 expect(await page.locator('#guesses').evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);expect(await page.locator('#guesses').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
 await page.locator('#guesses').evaluate(el=>el.scrollTop=0);await page.locator('.guess-card').first().click();expect(await page.evaluate(()=>scrollY)).toBe(0);await page.locator('#help-open').click();await expect(page.locator('#help')).toBeVisible();await page.locator('#help-close').click();await expect(page.locator('#help')).not.toBeVisible();
});

async function primaryAnswers(page,difficulty){return page.evaluate(async difficulty=>{const {makeRound,familyCounts}=await import('/arcade/equation-engine.js'),families=Array.from({length:familyCounts[difficulty]},(_,i)=>i);for(let i=families.length-1;i>0;i--){const j=Math.floor(.3*(i+1));[families[i],families[j]]=[families[j],families[i]];}return families.slice(0,3).map(f=>makeRound(difficulty,()=>.3,f).expression);},difficulty);}
async function unlockBonus(page,difficulty,family,count){
 await page.addInitScript(()=>{Math.random=()=>.3;performance.now=()=>1000;});await page.goto(`/arcade/equation.html?difficulty=${difficulty}`);
 const answers=await primaryAnswers(page,difficulty);
 for(let i=0;i<3;i++){await expect(page.locator('#round-label')).toHaveText(`0${i+1} / 03`);await page.locator('#equation').fill(answers[i]);await page.locator('#submit').click();await expect(page.locator('#submit')).toBeDisabled();if(i===2){await expect(page.locator('#finish')).toHaveText('Bonus equation →');await page.evaluate(({family,count})=>{let first=true;Math.random=()=>{if(first){first=false;return (family+.1)/count;}return .3;};},{family,count});}await page.locator('#finish').click();}
 await expect(page.locator('#round-label')).toHaveText('BONUS');await expect(page.locator('#total')).toContainText('30,000');
}
for(const [difficulty,family,count,name,guess]of [['easy',0,2,'Circle','x^2+y^2=4'],['easy',1,2,'Ellipse','x^2/9+y^2/4=1'],['medium',0,3,'Rotated ellipse','x^2/9+y^2=1'],['medium',1,3,'Hyperbola','x^2-y^2=1'],['hard',0,5,'Sphere','x^2+y^2+z^2=4'],['hard',2,5,'Cone','x^2+y^2=z^2']])test(`Bonus ${name}: three exact rounds unlock hint, paired plots and added score`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await unlockBonus(page,difficulty,family,count);
 await page.locator('#show-hint').click();await expect(page.locator('#hint')).toContainText(name);await expect(page.locator('.hint-formula')).toContainText('=');await expect(page.locator('#prefix')).toBeHidden();
 await page.locator('#equation').fill(guess);await page.locator('#submit').click();await expect(page.locator('.guess-card canvas')).toHaveCount(2);await expect(page.locator('.guess-meta')).toContainText('algebraic credit');await expect(page.locator('#error')).toBeEmpty();
 const expression=await page.evaluate(async({difficulty,family})=>{const {makeRound,familyCounts}=await import('/arcade/equation-engine.js');return makeRound(difficulty,()=>.3,familyCounts[difficulty]+family).expression;},{difficulty,family});
 await page.locator('#equation').fill(expression);await page.locator('#submit').click();await expect(page.locator('#submit')).toBeDisabled();await expect(page.locator('#round-result')).toHaveText(expression);await expect(page.locator('.guess-card').last()).toContainText('Exact');await expect(page.locator('#finish')).toHaveText('See total →');await page.locator('#finish').click();await expect(page.locator('.round-summary')).toHaveCount(4);await expect(page.locator('.bonus-summary')).toContainText('BONUS');await expect(page.locator('#final-score')).toHaveText('34,600');expect(await page.locator('#complete').evaluate(el=>el.scrollTop)).toBe(0);
 await page.locator('#initials').fill('BON');await page.locator('#save-form button').click();await expect(page.locator('#score-list')).toContainText('34,600');await page.reload();await page.locator('#scores-open').click();await expect(page.locator('#score-list')).toContainText('34,600');expect(errors).toEqual([]);
});
test('a near-perfect main round does not finish early or unlock the bonus',async({page})=>{
 await page.addInitScript(()=>Math.random=()=>.3);await page.goto('/arcade/equation.html?difficulty=easy');const answers=await primaryAnswers(page,'easy');
 for(let i=0;i<3;i++){await page.locator('#equation').fill(answers[i]+(i===0?'+0.000001':''));await page.locator('#submit').click();if(i===0){await expect(page.locator('#submit')).toBeEnabled();await expect(page.locator('.fit')).not.toHaveText('Exact');await page.locator('#finish').click();}if(i===2)await expect(page.locator('#finish')).toHaveText('See total →');await page.locator('#finish').click();}
 await expect(page.locator('.round-summary')).toHaveCount(3);await expect(page.locator('.bonus-summary')).toHaveCount(0);
});
