'use client';
import React,{useState} from 'react';
import {CATEGORIES,cleanQuarter,specialRewardsForCard} from '../lib/rewards.mjs';

export default function QuarterEditor({initial,card,onSave,onReset}) {
 const [draft,setDraft]=useState(()=>structuredClone(initial??cleanQuarter()));
 const toggle=category=>setDraft(current=>{
  const rules={...current.rules};
  if(rules[category])delete rules[category];else rules[category]={add:4,only:'',merchant:''};
  return {...current,rules};
 });
 const change=(category,patch)=>setDraft(current=>({...current,rules:{...current.rules,[category]:{...current.rules[category],...patch}}}));
 const portalRate=specialRewardsForCard(card).find(offer=>offer.key==='chaseTravel')?.rate??5;
 return <form onSubmit={e=>{e.preventDefault();onSave(cleanQuarter(draft));}}>
  <p className="editor-context">{card.issuer} {card.name}</p>
  <p className="point-hint">Enter the extra reward added to the card’s standard rate.</p>
  <div className="quarter-settings">
   <label className="field">Combined spending limit ($)
    <input type="number" min="1" max="1000000" step="1" required value={draft.limit} onChange={e=>setDraft({...draft,limit:e.target.value})}/>
   </label>
   <label className="inline-check"><input type="checkbox" checked={draft.activationRequired} onChange={e=>setDraft({...draft,activationRequired:e.target.checked})}/>Activation required</label>
  </div>
  <div className="quarter-category-list">
   {CATEGORIES.map(category=>{
    const rule=draft.rules[category.id];
    const normal=rule?.portal?portalRate:(card.rates[category.id]??card.base);
    const total=Math.round((Number(normal)+Number(rule?.add??0))*100)/100;
    return <fieldset className="quarter-category" key={category.id}>
     <legend><label className="inline-check"><input type="checkbox" checked={!!rule} onChange={()=>toggle(category.id)}/>{category.name}</label></legend>
     {rule&&<div className="quarter-category-fields">
      <div className="quarter-rate-row"><label className="field base-field">Extra reward (+%)
       <input aria-label={`${category.name} quarterly bonus`} type="number" min="0" max="100" step="0.001" required value={rule.add} onChange={e=>change(category.id,{add:e.target.value})}/>
      </label><span className="rate-preview">{Number.isFinite(total)?`${total}% total`:''}</span></div>
      {card.id==='flex'&&category.id==='travel'&&<label className="inline-check"><input type="checkbox" checked={!!rule.portal} onChange={e=>change(category.id,{portal:e.target.checked})}/>Requires Chase Travel</label>}
      <label className="field">Specific company / benefit (optional)
       <input aria-label={`${category.name} quarterly company`} maxLength={100} value={rule.merchant??''} placeholder="e.g. Amazon.com" onChange={e=>change(category.id,{merchant:e.target.value})}/>
       <small className="point-hint">Named offers appear under Uncategorized.</small>
      </label>
      <label className="field">Conditions <span className="optional-label">(optional)</span>
       <textarea aria-label={`${category.name} quarterly conditions`} rows={2} maxLength={1500} value={rule.only??''} placeholder="Eligible merchants or other restrictions" onChange={e=>change(category.id,{only:e.target.value})}/>
      </label>
     </div>}
    </fieldset>;
   })}
  </div>
  <div className="dialog-actions"><button type="button" className="text-button" onClick={onReset}>Restore default quarter</button><button className="primary" type="submit">Save quarter</button></div>
 </form>;
}
