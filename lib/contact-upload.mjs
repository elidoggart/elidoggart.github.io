export function contactUpload(endpoint,escape){
 if(!endpoint)return '';
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Contact upload endpoint must use HTTPS.');
 return `<form class="contact-upload" method="post" enctype="multipart/form-data" action="${escape(endpoint)}" data-contact-upload data-endpoint="${escape(endpoint)}" aria-labelledby="upload-heading">
 <h3 id="upload-heading">Send me a file</h3>
 
 <label for="upload-name">Your name <span>(optional)</span></label><input id="upload-name" name="name" autocomplete="name" maxlength="100">
 <label for="upload-email">Email <span>(optional)</span></label><input id="upload-email" name="email" type="email" autocomplete="email" maxlength="254">
 <label for="upload-message">Message <span>(optional)</span></label><textarea id="upload-message" name="message" rows="3" maxlength="2000"></textarea>
 <label for="upload-file">File <span>(optional)</span></label><input id="upload-file" name="file" type="file" aria-describedby="upload-help">
 <p id="upload-help">Up to 50 MB. Saved privately to my Google Drive.</p>
 <div hidden><label>Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
 <button type="submit">Send</button><p role="status" aria-live="polite" data-upload-status></p>
 </form>`;
}
