'use client';
import React, {useEffect, useId, useRef, useState} from 'react';
import {Search, ChevronDown, X} from 'lucide-react';
import {matchesCard} from '../lib/card-search.mjs';

export default function CardPicker({cards, onToggle, onManage}) {
 const [query, setQuery] = useState(''), [open, setOpen] = useState(false);
 const root = useRef(null), input = useRef(null), id = useId();
 const matches = cards.filter(card => matchesCard(card, query));
 const selected = cards.filter(card => card.enabled).length;
 const close = () => { setOpen(false); setQuery(''); };

 useEffect(() => {
  const outside = event => {
   if (!root.current?.contains(event.target)) { setOpen(false); setQuery(''); }
  };
  document.addEventListener('pointerdown', outside);
  document.addEventListener('focusin', outside);
  return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); };
 }, []);

 return <div className="card-picker-row">
  <div className="card-picker" ref={root}
   onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); input.current.focus(); close(); }
   }}>
   <div className="card-search-box">
    <Search size={15} aria-hidden="true"/>
    <input ref={input} type="search" aria-label="Search cards or brands" placeholder="Search cards or brands"
     autoComplete="off" value={query} aria-controls={open ? id : undefined}
     onFocus={() => setOpen(true)} onClick={() => setOpen(true)}
     onChange={event => { setQuery(event.target.value); setOpen(true); }}
     onKeyDown={event => {
      if (event.key === 'ArrowDown') {
       event.preventDefault();
       if (!open) setOpen(true);
       else root.current.querySelector('.card-picker-option input')?.focus();
      }
     }}/>
    {query && <button type="button" className="search-icon-button" aria-label="Clear card search"
     onClick={() => { setQuery(''); input.current.focus(); }}><X size={14}/></button>}
    <button type="button" className="search-icon-button" aria-label={open ? 'Close card list' : 'Show card list'}
     aria-expanded={open} aria-controls={open ? id : undefined}
     onClick={() => { if (open) close(); else { input.current.focus(); setOpen(true); } }}>
     <ChevronDown size={15} style={{transform:open ? 'rotate(180deg)' : undefined}}/>
    </button>
   </div>
   {open && <div className="card-picker-menu" id={id}>
    <div className="card-picker-results" role="group" aria-label="Matching cards">
     {matches.map(card => <label key={card.id} className="card-picker-option">
      <input type="checkbox" checked={!!card.enabled} onChange={() => onToggle(card)}/>

      <span><span>{card.name}</span><small>{card.issuer}</small></span>
     </label>)}
     {!matches.length && <p className="card-search-empty">No matching cards.</p>}
    </div>
    <span className="sr-only" role="status">{matches.length} matching cards</span>
   </div>}
  </div>
  <span className="selection-count" aria-live="polite">{selected} selected</span>
  <button type="button" className="add-button" onClick={onManage}>Edit cards</button>
 </div>;
}
