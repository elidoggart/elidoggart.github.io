import {test,expect} from '@playwright/test';
test('persistent preview selects nested content and updates without saving',async({page,context})=>{
 await page.goto('/editor/');await expect(page.locator('#status')).not.toHaveText('Loading content…');
 const opened=context.waitForEvent('page');await page.getByRole('button',{name:'Pop-out preview',exact:true}).click();const popup=await opened;
 const preview=popup.frameLocator('iframe');await expect(preview.locator('.name')).toBeVisible();
 await preview.getByRole('button',{name:/Expand Nimbus Power Systems.*Internship/}).click();await preview.getByRole('heading',{name:'LabView',exact:true}).click();
 const field=page.locator('input[data-path="portfolio.sections[0].entries[0].roles[1].blocks[2].title"]');
 await expect(field).toBeVisible();await expect(field).toBeFocused();await field.fill('LabView live preview');
 await expect(preview.getByRole('heading',{name:'LabView live preview',exact:true})).toBeVisible();await expect(page.locator('#draft-state')).toHaveText('Unsaved changes');
 await page.getByRole('button',{name:'Pop-out preview',exact:true}).click();expect(context.pages()).toHaveLength(2);
 await popup.getByLabel('Preview width').selectOption('390px');await expect(popup.locator('iframe')).toHaveCSS('width','390px');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(preview.getByRole('heading',{name:'LabView',exact:true})).toBeVisible();
 await preview.getByRole('heading',{name:'LabView',exact:true}).click();await field.fill('');await expect(popup.getByRole('status')).toContainText('last valid preview');await field.fill('LabView restored');await expect(preview.getByRole('heading',{name:'LabView restored',exact:true})).toBeVisible();
 await popup.close();const reopened=context.waitForEvent('page');await page.getByRole('button',{name:'Pop-out preview',exact:true}).click();await expect((await reopened).frameLocator('iframe').locator('.name')).toBeVisible();
});
test('blocked popup gives an actionable message',async({page})=>{
 await page.goto('/editor/');await expect(page.locator('#status')).not.toHaveText('Loading content…');await page.evaluate(()=>window.open=()=>null);await page.getByRole('button',{name:'Pop-out preview',exact:true}).click();await expect(page.locator('#status')).toContainText('Allow pop-ups');
});
