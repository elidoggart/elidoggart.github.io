// Parent functions, then transformations and combinations.
// Teaching references and difficulty rationale: equation-learning.md.
// Keep expression, viewing window and both hints together.
const family=(id,expression,hint,form,domain)=>({id,expression,hint,form,domain});
export const graphFamilies={
 easy:[
  family('linear',p=>`${p.a}x + ${p.b}`,'Linear · slope + offset','ax + b',()=>[-4,4]),
  family('quadratic',p=>`${p.k}(x - ${p.b})^2 - ${p.a}`,'Quadratic · shifted parabola','a(x − h)² + k',()=>[-4,4]),
  family('absolute',p=>`${p.a}abs(x - ${p.b}) - ${p.a}`,'Absolute value · shifted V','a|x − h| + k',()=>[-4,4]),
  family('sine',p=>`${p.a}sin(x) + ${p.b}`,'Sinusoidal · sine + offset','a sin(x) + k',()=>[-5,5]),
  family('cubic',p=>`${p.s}x^3 + ${p.b}`,'Cubic · flat middle, steeper ends','ax³ + k',()=>[-2.5,2.5]),
  family('cube-root',p=>`${p.s}cbrt(x) + ${p.b}`,'Cube root · steep middle, flatter ends','a cbrt(x) + k',()=>[-8,8]),
  family('square-root',p=>`${p.s}sqrt(x) + ${p.b}`,'Square root · starts at an endpoint','a sqrt(x) + k',()=>[0,9]),
  family('growth',p=>`${p.a} * 2^x + ${p.b}`,'Exponential growth · doubles each step','a · 2^x + k',()=>[-3,3]),
  family('decay',p=>`${p.a} * 0.5^x + ${p.b}`,'Exponential decay · halves each step','a · (1/2)^x + k',()=>[-3,3]),
  family('logarithm',p=>`${p.s}ln(x) + ${p.b}`,'Logarithmic · steep near zero, then flatter','a ln(x) + k',()=>[0.25,8])
 ],
 medium:[
  family('sine',p=>`${p.s}sin(${p.k}x + ${p.b})`,'Sinusoidal · amplitude, frequency and phase','a sin(bx + c)',()=>[-5,5]),
  family('cubic-linear',p=>`${p.k}(x - ${p.b})^3 - ${p.a}x`,'Cubic + linear · two turning points','a(x − h)³ + bx',p=>[p.b-3,p.b+3]),
  family('gaussian',p=>`${p.a}exp(-${p.k}(x - ${p.b})^2)`,'Exponential · shifted Gaussian bell','a e^(−b(x − h)²)',()=>[-5,5]),
  family('cosine-linear',p=>`${p.a}cos(x) + ${p.k}x`,'Sinusoidal + linear · wave on a slope','a cos(x) + bx',()=>[-5,5]),
  family('rational',p=>`${p.a}/(1 + (x - ${p.b})^2)`,'Rational · reciprocal quadratic','a / (1 + (x − h)²)',()=>[-5,5]),
  family('quadratic-sine',p=>`${p.k}x^2 + ${p.a}sin(2x)`,'Quadratic + sinusoidal · rippled parabola','ax² + b sin(cx)',()=>[-3,3]),
  family('cube-root',p=>`${p.s}cbrt(x - ${p.b}) + ${p.a}`,'Cube root · shifted center and stretch','a cbrt(x − h) + k',p=>[p.b-8,p.b+8]),
  family('square-root',p=>`${p.s}sqrt(x - ${p.b}) - ${p.a}`,'Square root · shifted endpoint and stretch','a sqrt(x − h) + k',p=>[p.b,p.b+9]),
  family('decay',p=>`${p.a}exp(-${p.k}(x - ${p.b})) - ${p.a}`,'Exponential decay · rate, shift and asymptote','a exp(−b(x − h)) + k',p=>[p.b-2/p.k,p.b+4/p.k]),
  family('growth',p=>`${p.a}exp(${p.k}(x - ${p.b})) - ${p.a}`,'Exponential growth · rate, shift and asymptote','a exp(b(x − h)) + k',p=>[p.b-4/p.k,p.b+2/p.k]),
  family('logarithm',p=>`${p.s}ln(x - ${p.b}) + ${p.a}`,'Logarithmic · shifted domain and stretch','a ln(x − h) + k',p=>[p.b+0.25,p.b+8]),
  family('quartic',p=>`${p.k}(x^2 - ${p.a})^2 + ${p.b}`,'Quartic · W-shaped curve with three turns','a(x² − b)² + k',()=>[-2.5,2.5]),
  family('absolute-linear',p=>`${p.a+1}abs(x - ${p.b}) + ${p.k}x`,'Absolute value + linear · unequal arms','a|x − h| + bx',()=>[-5,5]),
  family('damped-wave',p=>`${p.a}exp(-0.5x)sin(${p.k+1}x)`,'Exponential × sinusoidal · shrinking wave','a exp(−bx) sin(cx)',()=>[0,8]),
  family('logistic',p=>`${p.a+2}/(1 + exp(-${p.k}(x - ${p.b})))`,'Logistic · S-curve between two plateaus','a / (1 + exp(−b(x − h)))',p=>[p.b-5/p.k,p.b+5/p.k]),
  family('cube-root-linear',p=>`${p.a}cbrt(x - ${p.b}) - ${p.k}x`,'Cube root + linear · steep center on a slope','a cbrt(x − h) + bx',p=>[p.b-8,p.b+8])
 ],
 hard:[
  family('bowl',p=>`${p.k}(x^2 + y^2) - ${p.a}`,'Quadratic · sum of squares','a(x² + y²) + c'),
  family('saddle',p=>`${p.k}(x^2 - y^2) + ${p.b}`,'Quadratic · difference of squares','a(x² − y²) + c'),
  family('waves',p=>`${p.a}sin(x)cos(y)`,'Sinusoidal · sine × cosine','a sin(x) cos(y)'),
  family('gaussian',p=>`${p.a}exp(-${p.k}(x^2 + y^2))`,'Exponential · Gaussian surface','a e^(−b(x² + y²))'),
  family('bilinear',p=>`${p.k}x*y + ${p.b}`,'Bilinear · x × y','axy + c'),
  family('radial',p=>`${p.a}sin(${p.k}sqrt(x^2 + y^2))`,'Sinusoidal · radial distance','a sin(b√(x² + y²))')
 ]
};
export const familyCounts=Object.fromEntries(Object.entries(graphFamilies).map(([mode,families])=>[mode,families.length]));
