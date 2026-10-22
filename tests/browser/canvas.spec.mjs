import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const original=JSON.parse(await readFile('tests/fixtures/editor-content.json','utf8')).portfolio;
const frame=page=>page.frameLocator('#preview');
const field=(page,path)=>frame(page).locator('[data-edit-path="'+path+'"]');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('eli-portfolio-draft-v1')).portfolio);
test('visual canvas edits plain text, saves/reloads, previews and preserves keyboard navigation',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/editor/visual.html');
 await expect(page.locator('#fields')).toBeHidden();await expect(page.locator('#publish')).toBeDisabled();
 const title=field(page,'sections[0].entries[0].title');await title.fill('Nimbus review edit');await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');expect((await saved(page)).sections[0].entries[0].title).toBe('Nimbus review edit');
 await page.reload();await expect(title).toHaveText('Nimbus review edit');await title.fill('Nimbus <script>plain text</script>');await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');await expect(frame(page).locator('#title-nimbus')).toHaveText('Nimbus <script>plain text</script>');expect(await frame(page).locator('#title-nimbus script').count()).toBe(0);
 await page.getByRole('button',{name:'Preview',exact:true}).click();await expect(frame(page).locator('[contenteditable]')).toHaveCount(0);await frame(page).getByRole('link',{name:'Projects',exact:true}).press('Enter');await expect(frame(page).locator('#view-projects')).toBeVisible();await page.getByRole('button',{name:'Back to editing',exact:true}).click();await expect(field(page,'sections[1].entries[0].title')).toBeVisible();
 await frame(page).getByRole('link',{name:'Work',exact:true}).click();await expect(title).toBeVisible();await title.press('Tab');expect(await frame(page).locator('[data-edit-path="sections[0].entries[0].intro"]').evaluate(e=>e===e.ownerDocument.activeElement)).toBe(true);expect(errors).toEqual([]);
});
test('context controls add roles and text, reorder/remove with undo, and keep stable IDs',async({page})=>{
 await page.goto('/editor/visual.html');await field(page,'sections[0].entries[0].title').click();await page.getByRole('button',{name:'Add role',exact:true}).click();await expect(page.locator('#fields')).toBeVisible();await page.getByRole('textbox',{name:'Role name',exact:true}).fill('Review role');await page.getByRole('button',{name:'Close details',exact:true}).click();await expect(field(page,'sections[0].entries[0].roles[2].label')).toHaveText('Review role');
 await field(page,'sections[0].entries[0].roles[2].label').click();await page.getByRole('button',{name:'Add paragraph',exact:true}).click();const p='sections[0].entries[0].roles[2].blocks[0].text';await expect(field(page,p)).toBeVisible();await field(page,p).fill('A review-only paragraph.');await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');let data=await saved(page);expect(data.sections[0].entries[0].roles[2].blocks[0].text).toBe('A review-only paragraph.');expect(data.sections[0].entries[0].id).toBe('nimbus');
 // Hold the next preview load so rapid Undo sees a partially loaded iframe.
 let releasePreview;const previewGate=new Promise(resolve=>releasePreview=resolve);
 await page.route('**/style.css',async route=>{await previewGate;await route.continue();});
 await field(page,p).click();await page.getByRole('button',{name:'Remove',exact:true}).click();await page.getByRole('button',{name:'Remove from draft',exact:true}).click();
 await expect(field(page,p)).toHaveCount(0);
 await page.getByRole('button',{name:'Undo',exact:true}).click();releasePreview();await expect(field(page,p)).toBeVisible();
 await field(page,'sections[0].entries[0].roles[2].label').click();await page.getByRole('button',{name:'Move up',exact:true}).click();await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');data=await saved(page);expect(data.sections[0].entries[0].roles[1].label).toBe('Review role');expect(data.sections[0].entries[0].roles[2].id).toBe('nimbus-internship');
});
test('images require alt text, cancel safely, and support inline replacement and detail editing',async({page})=>{
 await page.goto('/editor/visual.html');await frame(page).locator('#entry-nimbus > .entry-summary > .entry-photo > figure').click();await page.getByRole('button',{name:'Replace image',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.locator('.image-choice[data-media=photo-00]').click();await page.getByRole('textbox',{name:'Image description (alt text)',exact:true}).fill('');await expect(page.getByRole('button',{name:'Use image',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Replace image',exact:true}).click();await page.locator('.image-choice[data-media=photo-00]').click();await page.getByRole('textbox',{name:'Image description (alt text)',exact:true}).fill('Review-only image description');await page.getByRole('button',{name:'Use image',exact:true}).click();await expect(frame(page).locator('#entry-nimbus > .entry-summary img')).toHaveAttribute('alt','Review-only image description');
 await expect(frame(page).locator('#entry-nimbus > .entry-summary > .entry-photo > figure')).toHaveAttribute('tabindex','0');await frame(page).locator('#entry-nimbus > .entry-summary > .entry-photo > figure').press('Enter');await expect(page.locator('#fields')).toBeVisible();await expect(page.getByRole('textbox',{name:'Image description (alt text)',exact:true})).toHaveValue('Review-only image description');await page.getByRole('button',{name:'Close details',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(frame(page).locator('#entry-nimbus > .entry-summary img')).toHaveAttribute('src',original.media.find(m=>m.id===original.sections[0].entries[0].image[0].media).src);
});
test('canvas matches public layout without controls inside the page and retains all disclosure behavior',async({page,browser})=>{
 await page.goto('/editor/visual.html');await field(page,'sections[0].entries[0].title').waitFor();const dimensions=await page.locator('#preview').boundingBox();const publicPage=await browser.newPage({viewport:{width:Math.round(dimensions.width),height:Math.round(dimensions.height)}});await publicPage.goto('/');
 const metrics=scope=>scope.locator('#entry-nimbus').evaluate(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return {width:r.width,font:s.fontFamily,border:s.borderColor};});expect(await metrics(frame(page))).toEqual(await metrics(publicPage));await publicPage.close();
 for(const section of ['projects','skills','passions','contact','work']){await frame(page).getByRole('link',{name:section[0].toUpperCase()+section.slice(1),exact:true}).click();await expect(frame(page).locator('#view-'+section)).toBeVisible();}
 await frame(page).locator('[data-expand="nimbus-internship"]').press('Enter');await expect(frame(page).locator('#details-nimbus-internship')).toBeVisible();await frame(page).locator('[data-collapse="nimbus-internship"]').press('Enter');await expect(frame(page).locator('[data-expand="nimbus-internship"]')).toBeFocused();await page.screenshot({path:'.local/visual-editor-desktop.png'});
});
test('new entry, image upload cancellation, validation errors, and mobile controls stay recoverable',async({page})=>{
 await page.goto('/editor/visual.html');await page.getByRole('button',{name:'Add job',exact:true}).click();await page.getByRole('textbox',{name:'Company or organization',exact:true}).fill('Review employer');await page.getByRole('button',{name:'Close details',exact:true}).click();await field(page,'sections[0].entries[8].title').click();await page.getByRole('button',{name:'Add image',exact:true}).click();
 await page.getByLabel('Choose image file',{exact:true}).setInputFiles('assets/media/mott-permeability-chart.jpg');await expect(page.locator('.image-preview img')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');expect((await saved(page)).media).toHaveLength(original.media.length);
 await field(page,'site.name').first().fill('');await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved in this browser, including unfinished edits');await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(field(page,'site.name').first()).toHaveText('Eli Doggart');
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Resume',exact:true}).click();await expect(page.getByLabel('Upload resume PDF',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'.local/visual-editor-mobile.png'});
});


test('split sections bind interleaved text and images to their original draft positions',async({page})=>{
 const data=structuredClone(original),photo=structuredClone(data.sections[0].entries[0].image[0]);
 data.sections[0].entries[0].roles[0].blocks=[{type:'section',title:'Mixed evidence',level:4,chapter:false,layout:'split',blocks:[
  {type:'figure',layout:'plain',image:photo},{type:'text',style:'body',text:'First explanation'},
  {type:'gallery',layout:'grid',images:[photo]},{type:'text',style:'italic',text:'Second explanation'}
 ]}];
 await page.addInitScript(data=>{if(!localStorage.getItem('eli-portfolio-draft-v1'))localStorage.setItem('eli-portfolio-draft-v1',JSON.stringify({portfolio:data}));},data);await page.goto('/editor/visual.html');
 const prefix='sections[0].entries[0].roles[0].blocks[0].blocks';await expect(frame(page).locator('#view-passions .canvas-add-entry')).toHaveCount(1);await expect(page.locator('#status')).not.toContainText('could not display');
 await frame(page).locator('[data-expand="'+data.sections[0].entries[0].roles[0].id+'"]').click();await expect(field(page,prefix+'[1].text')).toHaveText('First explanation');await expect(field(page,prefix+'[3].text')).toHaveText('Second explanation');
 await field(page,prefix+'[1].text').fill('Updated first explanation');await field(page,prefix+'[3].text').fill('Updated second explanation');
 await frame(page).locator('[data-canvas-path="'+prefix+'[2].images[0]"]').press('Enter');await expect(page.getByRole('textbox',{name:'Image description (alt text)',exact:true})).toHaveValue(photo.alt);await page.getByRole('textbox',{name:'Image description (alt text)',exact:true}).fill('Updated second image description');
 await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');
 const blocks=(await saved(page)).sections[0].entries[0].roles[0].blocks[0].blocks;expect(blocks.map(block=>block.type)).toEqual(['figure','text','gallery','text']);expect(blocks[0].image).toEqual(photo);expect(blocks[1].text).toBe('Updated first explanation');expect(blocks[2].images[0].alt).toBe('Updated second image description');expect(blocks[3].text).toBe('Updated second explanation');
});

test('photo-only entries retain an editable summary slot and contact-card fields stay editable',async({page})=>{
 const data=structuredClone(original);data.sections[1].entries[0].intro='';
 await page.addInitScript(data=>{if(!localStorage.getItem('eli-portfolio-draft-v1'))localStorage.setItem('eli-portfolio-draft-v1',JSON.stringify({portfolio:data}));},data);await page.goto('/editor/visual.html');
 await expect(frame(page).locator('#view-passions .canvas-add-entry')).toHaveCount(1);await expect(page.locator('#status')).not.toContainText('could not display');await frame(page).getByRole('link',{name:'Projects',exact:true}).click();
 const intro=field(page,'sections[1].entries[0].intro');await expect(intro).toBeVisible();await expect(intro).toHaveText('');await intro.fill('Optional project summary added later.');
 await frame(page).getByRole('link',{name:'Contact',exact:true}).click();const contact=frame(page).locator('.contact-card-info');
 await contact.locator('[data-edit-path="site.name"]').fill('Updated contact name');await contact.locator('[data-edit-path="site.email"]').fill('review@example.com');await contact.locator('[data-edit-path="site.phone"]').fill('860 555 0101');
 await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');const result=await saved(page);expect(result.sections[1].entries[0].intro).toBe('Optional project summary added later.');expect(result.site).toMatchObject({name:'Updated contact name',email:'review@example.com',phone:'860 555 0101'});
});
