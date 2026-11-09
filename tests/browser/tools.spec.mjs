import {test,expect} from '@playwright/test';

test('Passions links to the tool menu and rewards keep arcade return controls',async({page})=>{
 await page.goto('/#passions');
 const links=page.getByRole('navigation',{name:'Explore',exact:true});
 await expect(links.getByRole('link',{name:'Arcade'})).toHaveAttribute('href','arcade/');
 await links.getByRole('link',{name:'Tools'}).click();
 await expect(page).toHaveURL(/\/tools\/$/);
 await page.getByRole('link',{name:'Open credit card rewards'}).click();
 await expect(page.getByRole('heading',{name:'Credit card rewards',exact:true})).toBeVisible();
 await expect(page.getByRole('searchbox',{name:'Search cards or brands'})).toBeVisible();
 await page.getByRole('button',{name:'Rates & sources',exact:true}).click();
 await expect(page.locator('dialog[open]')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('dialog[open]')).toHaveCount(0);
 await expect(page).toHaveURL(/\/tools\/credit-cards\/$/);
 await page.getByRole('link',{name:'← Tools',exact:true}).click();
 await expect(page).toHaveURL(/\/tools\/$/);
 await page.keyboard.down('Escape');
 await expect(page).toHaveURL('http://127.0.0.1:4175/');
 await page.keyboard.up('Escape');
});

test('rewards header fits a phone and holding Escape returns from the tool',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/tools/credit-cards/');
 await expect(page.getByRole('link',{name:'Portfolio',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.keyboard.down('Escape');
 await expect(page).toHaveURL('http://127.0.0.1:4175/');
 await page.keyboard.up('Escape');
});

for(const touch of [false,true])test(`card search selects and deselects by row on ${touch?'touch':'desktop'}`,async({browser})=>{
 const context=await browser.newContext({hasTouch:touch,viewport:touch?{width:390,height:844}:{width:1440,height:1000}});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:4175/tools/credit-cards/');
 await expect(page.getByText('0 selected',{exact:true})).toBeVisible();
 const search=page.getByRole('searchbox',{name:'Search cards or brands'});
 await search.fill('freedom flex');
 const matches=page.getByRole('group',{name:'Matching cards'});
 const checkbox=matches.getByRole('checkbox',{name:/Freedom Flex/});
 const label=matches.getByText('Freedom Flex',{exact:true});
 if(touch)await label.tap();else await label.click();
 await expect(checkbox).toBeChecked();
 await expect(page.getByText('1 selected',{exact:true})).toBeVisible();
 if(touch)await label.tap();else await label.click();
 await expect(checkbox).not.toBeChecked();
 await expect(page.getByText('0 selected',{exact:true})).toBeVisible();
 // Keyboard selection and persistence use the same native checkbox.
 await search.focus();await search.press('ArrowDown');await checkbox.press('Space');
 await expect(checkbox).toBeChecked();
 await page.reload();
 await expect(page.getByText('1 selected',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Edit cards',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await expect(dialog.getByText('Add a preset',{exact:true})).toHaveCount(0);
 const allCards=dialog.getByRole('checkbox');
 expect(await allCards.count()).toBeGreaterThan(170);
 await dialog.getByRole('searchbox',{name:'Filter cards by name or brand'}).fill('costco');
 await dialog.getByRole('checkbox').check();
 await dialog.getByRole('button',{name:'Close',exact:true}).click();
 await expect(page.getByText('2 selected',{exact:true})).toBeVisible();
 await context.close();
});
