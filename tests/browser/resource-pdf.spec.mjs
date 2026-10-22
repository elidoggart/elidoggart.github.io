import {test,expect} from '@playwright/test';
import {PDFDocument} from 'pdf-lib';
import fs from 'node:fs';
const fixture=JSON.parse(fs.readFileSync('tests/fixtures/editor-content.json')).portfolio;
const original=fs.readFileSync(fixture.site.resume);
async function openResource(page){await page.getByRole('button',{name:'Links & downloads',exact:true}).click();await page.locator('#fields > div .list > details').first().locator('summary').click();}
test('certificate replacement survives preview, save, reload, undo and a portable backup restored into empty storage',async({page,browser})=>{
 const pdf=await PDFDocument.load(original);pdf.setTitle('Certificate upload audit');const bytes=Buffer.from(await pdf.save());
 await page.goto('/editor/');await openResource(page);const upload=page.getByLabel('Upload PDF',{exact:true});
 await upload.setInputFiles({name:'Certificate.pdf',mimeType:'application/pdf',buffer:Buffer.from('invalid')});await expect(page.locator('#status')).toContainText('not a complete PDF');
 const file={name:'Certificate.pdf',mimeType:'application/pdf',buffer:bytes};await upload.setInputFiles(file);await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByLabel('Website address',{exact:true})).toHaveValue(fixture.resources[0].url);
 await upload.setInputFiles(file);await page.getByRole('button',{name:'Use this PDF in draft',exact:true}).click();await expect(page.locator('#status')).toContainText('PDF added');
 await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('eli-portfolio-draft-v1')).portfolio);const src=data.resources[0].url;expect(src).toMatch(/^assets\/documents\/resume-[a-f0-9]{20}\.pdf$/);expect(data.site.resume).toBe(fixture.site.resume);
 // Renderer resolves draft PDF links without needing a deployed asset.
 const rendered=await page.evaluate(async()=>{const d=JSON.parse(localStorage.getItem('eli-portfolio-draft-v1')).portfolio;const {render}=await import('/lib/render.mjs');return render(d,{mediaURL:src=>src===d.resources[0].url?'blob:certificate-preview':src});});expect(rendered).toContain('href="blob:certificate-preview"');
 await page.reload();await openResource(page);await expect(page.getByRole('link',{name:'Open current link or PDF'})).toHaveAttribute('href',/^blob:/);
 await page.getByLabel('Website address',{exact:true}).fill('https://example.com/replacement');await page.getByRole('button',{name:'Undo',exact:true}).click();await openResourceAfterUndo(page);await expect(page.getByLabel('Website address',{exact:true})).toHaveValue(src);
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download backup',exact:true}).click();const download=await pending;const path=await download.path();
 const context=await browser.newContext();const fresh=await context.newPage();await fresh.goto('/editor/');await fresh.getByLabel('Restore backup',{exact:true}).setInputFiles({name:'portable.zip',mimeType:'application/zip',buffer:fs.readFileSync(path)});await fresh.getByRole('dialog').getByRole('button',{name:'Restore backup',exact:true}).click();await expect(fresh.locator('#status')).toContainText('Backup restored');await fresh.getByRole('button',{name:'Save Draft',exact:true}).click();
 expect(await fresh.evaluate(async src=>{const {getImages}=await import('/editor/drafts.mjs');return (await getImages()).get(src)?.size;},src)).toBe(bytes.length);await context.close();
});
async function openResourceAfterUndo(page){const details=page.locator('#fields > div .list > details').first();if(!await details.evaluate(e=>e.open))await details.locator('summary').click();}
test('new projects and skill details expose blank roles and dates, and PDF controls fit phones',async({page})=>{
 await page.goto('/editor/');for(const [section,add] of [['Projects','Add project'],['Skills','Add skill group']]){
  await page.getByRole('button',{name:section,exact:true}).click();await page.getByRole('button',{name:add,exact:true}).click();const entry=page.locator('.form-entry').last();await expect(entry.getByLabel('Role or description',{exact:true})).toBeVisible();await expect(entry.getByLabel('Dates',{exact:true})).toBeVisible();
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('combobox',{name:'Edit section',exact:true}).selectOption('resources');await page.locator('#fields > div .list > details').first().locator('summary').click();await expect(page.getByLabel('Upload PDF',{exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});


test('leaving a PDF field while it is being read cancels the detached upload and permits a retry',async({page})=>{
 await page.goto('/editor/');await openResource(page);
 await page.evaluate(()=>{const read=File.prototype.arrayBuffer;File.prototype.arrayBuffer=async function(){if(this.name==='Slow.pdf')await new Promise(resolve=>window.releasePDFRead=resolve);return read.call(this);};});
 const upload=page.getByLabel('Upload PDF',{exact:true}),input=await upload.elementHandle();
 await upload.setInputFiles({name:'Slow.pdf',mimeType:'application/pdf',buffer:original});await page.waitForFunction(()=>typeof window.releasePDFRead==='function');
 await page.getByRole('button',{name:'Work',exact:true}).click();await page.evaluate(()=>window.releasePDFRead());
 await expect.poll(()=>input.evaluate(node=>node.disabled)).toBe(false);await expect(page.getByRole('dialog')).toHaveCount(0);
 await openResource(page);await page.getByLabel('Upload PDF',{exact:true}).setInputFiles({name:'Retry.pdf',mimeType:'application/pdf',buffer:original});await page.getByRole('button',{name:'Use this PDF in draft',exact:true}).click();await expect(page.locator('#status')).toContainText('PDF added');
 await page.getByRole('button',{name:'Save Draft',exact:true}).click();await expect(page.locator('#status')).toContainText('Draft saved');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('eli-portfolio-draft-v1')).portfolio.resources[0].download)).toBe('Retry.pdf');
});

test('Escape cannot dismiss a PDF acceptance while storage is pending, and Undo remains exact',async({page})=>{
 await page.goto('/editor/');await openResource(page);await page.getByLabel('Upload PDF',{exact:true}).setInputFiles({name:'Pending.pdf',mimeType:'application/pdf',buffer:original});
 await expect(page.getByRole('button',{name:'Use this PDF in draft',exact:true})).toBeVisible();
 await page.evaluate(()=>{const read=Blob.prototype.arrayBuffer;Blob.prototype.arrayBuffer=async function(){if(this.type==='application/pdf')await new Promise(resolve=>window.releasePDFStore=resolve);return read.call(this);};});
 await page.getByRole('button',{name:'Use this PDF in draft',exact:true}).click();await page.waitForFunction(()=>typeof window.releasePDFStore==='function');await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'Review PDF',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Use this PDF in draft',exact:true})).toBeDisabled();
 await page.evaluate(()=>window.releasePDFStore());await expect(page.locator('#status')).toContainText('PDF added');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Undo',exact:true}).click();await openResourceAfterUndo(page);await expect(page.getByLabel('Website address',{exact:true})).toHaveValue(fixture.resources[0].url);
});


test('restoring the same PDF backup reuses its preview URL instead of retaining duplicate file buffers',async({page})=>{
 await page.addInitScript(()=>{const create=URL.createObjectURL,revoke=URL.revokeObjectURL;window.pdfURLs=new Set();URL.createObjectURL=function(blob){const url=create.call(this,blob);if(blob.type==='application/pdf')window.pdfURLs.add(url);return url;};URL.revokeObjectURL=function(url){window.pdfURLs.delete(url);return revoke.call(this,url);};});
 await page.goto('/editor/');await openResource(page);await page.getByLabel('Upload PDF',{exact:true}).setInputFiles({name:'Reusable.pdf',mimeType:'application/pdf',buffer:original});await page.getByRole('button',{name:'Use this PDF in draft',exact:true}).click();await expect(page.locator('#status')).toContainText('PDF added');
 await expect.poll(()=>page.evaluate(()=>window.pdfURLs.size)).toBe(1);
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download backup',exact:true}).click();const bytes=fs.readFileSync(await(await pending).path());
 for(let i=0;i<2;i++){
  await page.getByLabel('Restore backup',{exact:true}).setInputFiles({name:'repeat.zip',mimeType:'application/zip',buffer:bytes});await page.getByRole('dialog').getByRole('button',{name:'Restore backup',exact:true}).click();await expect(page.locator('#status')).toContainText('Backup restored');await expect.poll(()=>page.evaluate(()=>window.pdfURLs.size)).toBe(1);
 }
 await openResourceAfterUndo(page);await expect(page.getByRole('link',{name:'Open current link or PDF'})).toHaveAttribute('href',/^blob:/);
});
