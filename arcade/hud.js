// Frame-driven readouts only change the DOM when their visible value changes.
export function setText(element,value){const next=String(value);if(element.textContent!==next)element.textContent=next;}
export function setAttribute(element,name,value){const next=String(value);if(element.getAttribute(name)!==next)element.setAttribute(name,next);}
