// Browser-local patches and sample bytes. A transaction preserves other tabs' saves.
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('arcade-modular-library',1);r.onupgradeneeded=()=>r.result.createObjectStore('patches',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function transact(mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('patches',mode),request=action(tx.objectStore('patches'));tx.oncomplete=()=>{db.close();resolve(request.result);};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error||Error('Storage unavailable'));};});}
export const listPatches=()=>transact('readonly',s=>s.getAll());
export const savePatch=entry=>transact('readwrite',s=>s.put(entry));
export const deletePatch=id=>transact('readwrite',s=>s.delete(id));
