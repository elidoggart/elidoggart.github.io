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
 await expect(page.getByRole('link',{name:'Portfolio hold Esc'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.keyboard.down('Escape');
 await expect(page).toHaveURL('http://127.0.0.1:4175/');
 await page.keyboard.up('Escape');
});
