import React from 'react';
import {createRoot} from 'react-dom/client';
import CardCompass from './components/CardCompass.jsx';
createRoot(document.getElementById('root')).render(<CardCompass/>);

const observer=new MutationObserver(()=>{if(document.querySelector('.portfolio-return')){observer.disconnect();const script=document.createElement('script');script.src='/arcade/arcade.js';document.body.append(script);}});
observer.observe(document.getElementById('root'),{childList:true,subtree:true});
