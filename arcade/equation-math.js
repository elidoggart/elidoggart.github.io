const FN={sin:Math.sin,cos:Math.cos,tan:Math.tan,abs:Math.abs,sqrt:Math.sqrt,exp:Math.exp,ln:Math.log,log:Math.log,log10:Math.log10};
// A small mathematical grammar; user input is never executed as JavaScript.
const number=value=>({type:'number',value});
function node(type,a,b){
 if(a.type==='number'&&(!b||b.type==='number')){const value=type==='neg'?-a.value:type==='+'?a.value+b.value:type==='-'?a.value-b.value:type==='*'?a.value*b.value:type==='/'?a.value/b.value:type==='^'?a.value**b.value:NaN;if(Number.isFinite(value))return number(value);}
 if(type==='*'&&(a.value===0||b.value===0))return number(0);
 if((type==='+'||type==='-')&&b.value===0||type==='*'&&b.value===1||type==='/'&&b.value===1||type==='^'&&b.value===1)return a;
 if(type==='+'&&a.value===0||type==='*'&&a.value===1)return b;
 if(type==='^'&&b.value===0)return number(1);
 return {type,a,b};
}
function evaluator(n){if(n.type==='number')return()=>n.value;if(n.type==='x')return x=>x;if(n.type==='y')return(x,y,z)=>y;if(n.type==='z')return(x,y,z)=>z;const a=evaluator(n.a),b=n.b&&evaluator(n.b);switch(n.type){case 'call':return(x,y,z)=>FN[n.name](a(x,y,z));case 'neg':return(x,y,z)=>-a(x,y,z);case '+':return(x,y,z)=>a(x,y,z)+b(x,y,z);case '-':return(x,y,z)=>a(x,y,z)-b(x,y,z);case '*':return(x,y,z)=>a(x,y,z)*b(x,y,z);case '/':return(x,y,z)=>a(x,y,z)/b(x,y,z);case '^':return(x,y,z)=>a(x,y,z)**b(x,y,z);}}
export function compile(source,dimensions=2){
 const text=source.toLowerCase().replace(/^\s*[yz]\s*=/,'').replaceAll('π','pi').replaceAll('−','-').replaceAll('×','*').replaceAll('**','^');
 if(text.length>180)throw Error('Keep the equation under 180 characters.');
 const tokens=text.match(/(?:\d*\.)?\d+(?:e[+-]?\d+)?|log10|[a-z]+|[()+\-*/^]/g)||[];
 if(tokens.join('')!==text.replace(/\s/g,''))throw Error('Use numbers, x, operators and functions.');
 let i=0;
 function atom(){const t=tokens[i++];if(t==='('){const a=sum();if(tokens[i++]!==')')throw Error('Close each parenthesis.');return a;}if(Object.hasOwn(FN,t)){if(tokens[i++]!=='(')throw Error('Use parentheses after functions.');const a=sum();if(tokens[i++]!==')')throw Error('Close each parenthesis.');if(a.type==='number'&&Number.isFinite(FN[t](a.value)))return number(FN[t](a.value));return {type:'call',name:t,a};}if(t==='x'||t==='y'&&dimensions>=3||t==='z'&&dimensions>=4)return {type:t};if(t==='pi')return number(Math.PI);if(t==='e')return number(Math.E);if(t!==undefined&&/^\d|^\./.test(t))return number(Number(t));throw Error(dimensions===3?'Use x and y, e.g. x^2 - y^2.':'Use x, e.g. 2x^2 - 1.');}
 function power(){let a=atom();if(tokens[i]==='^'){i++;a=node('^',a,unary());}return a;}
 function unary(){if(tokens[i]==='-'){i++;return node('neg',unary());}if(tokens[i]==='+'){i++;return unary();}return power();}
 function product(){let a=unary();while(i<tokens.length){let op=tokens[i];const implicit=op==='('||/^[a-z\d.]/.test(op);if(op!=='*'&&op!=='/'&&!implicit)break;if(!implicit)i++;else op='*';a=node(op,a,unary());}return a;}
 function sum(){let a=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];a=node(op,a,product());}return a;}
 const ast=sum();if(i!==tokens.length)throw Error('Check your equation.');const fn=evaluator(ast);fn.ast=ast;return fn;
}
