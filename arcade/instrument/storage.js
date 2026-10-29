/* SPDX-License-Identifier: GPL-3.0-or-later */
// Structured audio stays local. No samples or performances are uploaded.
function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('arcade-instrument',1);request.onupgradeneeded=()=>request.result.createObjectStore('studio');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function readStudio(key){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('studio');const r=tx.objectStore('studio').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
export async function writeStudio(key,value){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('studio','readwrite');tx.objectStore('studio').put(value,key);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
