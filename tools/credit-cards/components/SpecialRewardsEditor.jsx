'use client';
import React from 'react';
import {specialRewardsForCard} from '../lib/rewards.mjs';

export default function SpecialRewardsEditor({card,onChange,onEditQuarter}) {
 const offers=specialRewardsForCard(card);
 if(!offers.length&&card.id!=='flex'&&!card.rotating)return null;
 const change=(offer,patch)=>onChange({...card,specialRewards:{...card.specialRewards,[offer.key]:{
  rate:card.specialRewards?.[offer.key]?.rate??offer.rate,
  condition:card.specialRewards?.[offer.key]?.condition??offer.condition,
  ...card.specialRewards?.[offer.key],
  ...patch,
 }}});
 return <details className="special-editor">
  <summary>Special rewards</summary>
  {offers.map(offer=><fieldset className="special-offer-fields" key={offer.key}>
   <legend>{offer.label}</legend>
   <label className="field base-field">Total rate ({card.rewardType==='points'?'points/$':'%'})
    <input aria-label={`${offer.label} total rate`} type="number" min="0" max="100" step="0.001" required
     value={card.specialRewards?.[offer.key]?.rate??offer.rate} onChange={e=>change(offer,{rate:e.target.value})}/>
   </label>
   <label className="field">Conditions
    <textarea aria-label={`${offer.label} conditions`} rows={3} maxLength={1500} required
     value={card.specialRewards?.[offer.key]?.condition??offer.condition} onChange={e=>change(offer,{condition:e.target.value})}/>
   </label>
   {(offer.starts!==undefined||offer.expires!==undefined)&&<div className="point-settings">{['starts','expires'].map(key=><label className="field" key={key}>{key==='starts'?'Starts':'Ends'}<input type="date" aria-label={`${offer.label} ${key}`} value={card.specialRewards?.[offer.key]?.[key]??offer[key]??''} onChange={e=>change(offer,{[key]:e.target.value})}/></label>)}</div>}
  </fieldset>)}
  <div className="special-editor-actions">
   <button type="button" className="text-button" onClick={()=>onChange({...card,specialRewards:{}})}>Restore default special rewards</button>
   {(card.id==='flex'||card.rotating)&&<button type="button" className="text-button" onClick={onEditQuarter}>Edit rotating schedule</button>}
  </div>
 </details>;
}
