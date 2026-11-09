export const LEVELS = ['Direction', 'Dots', 'Colors', 'Math'];
export const TRIALS = 5;
const pick = (n, rng) => Math.floor(rng() * n);
export function shuffle(items, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = pick(i + 1, rng); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
export function makeRun(level, rng = Math.random) {
  if (!Number.isInteger(level) || level < 0 || level > 3) throw new RangeError('Invalid level');
  const sides = shuffle([0, 0, 1, 1, pick(2, rng)], rng);
  const math = shuffle([[2,3],[2,4],[3,4],[2,5],[3,5],[4,2],[4,3],[5,2],[5,3]], rng);
  const mathTasks = shuffle(['+', '+', '+', '−', '−'], rng);
  const colorTasks = shuffle(['most','most','most','exact','exact'], rng);
  return sides.map((answer, i) => {
    const trial = {answer, wait: 1200 + rng() * 2400, prompt: '', sides: [[], []]};
    if (level === 0) trial.word = answer ? 'RIGHT' : 'LEFT';
    if (level === 1) {
      trial.sides[answer] = Array(5).fill('ink');
      trial.sides[1-answer] = Array(3).fill('ink');
    }
    if (level === 2) {
      const color = ['blue','red','gold'][pick(3,rng)];
      const other = ['blue','red','gold'].filter(c => c !== color);
      const exact = colorTasks[i] === 'exact';
      trial.prompt = exact ? `3 ${color} dots` : `Most ${color} dots`;
      trial.sides[answer] = shuffle([...Array(exact ? 3 : 4).fill(color), ...Array(exact ? 3 : 2).fill(other[0])], rng);
      trial.sides[1-answer] = shuffle([...Array(2).fill(color), ...Array(2).fill(other[0]), ...Array(2).fill(other[1])], rng);
    }
    if (level === 3) {
      const [a,b] = math[i];
      const subtract = mathTasks[i] === '−';
      const result = subtract ? a : a+b;
      trial.prompt = subtract ? `${a+b} − ${b}` : `${a} + ${b}`;
      trial.sides[answer] = result;
      trial.sides[1-answer] = result+(pick(2,rng) ? 1 : -1);
    }
    trial.positions = [shuffle([0,1,2,3,4,5,6,7,8],rng),shuffle([0,1,2,3,4,5,6,7,8],rng)];
    return trial;
  });
}
export class ReactionRun {
  constructor(level, rng) { this.trials = makeRun(level,rng); this.times=[]; this.state='waiting'; }
  show(now) { if(this.state !== 'waiting') return; this.started=now; this.state='active'; }
  respond(side, now) {
    if(!['waiting','active'].includes(this.state)) return null;
    if(this.state === 'waiting') { this.state='failed'; return 'Too soon'; }
    if(side !== this.trials[this.times.length].answer) { this.state='failed'; return 'Wrong side'; }
    const elapsed=now-this.started;
    if(elapsed < 80) { this.state='failed'; return 'Too soon'; }
    if(elapsed > 10000) { this.state='failed'; return 'Too slow'; }
    this.times.push(elapsed); this.state=this.times.length===TRIALS?'complete':'feedback'; return elapsed;
  }
  get average() { return this.state==='complete' ? Math.round(this.times.reduce((a,b)=>a+b,0)/TRIALS) : null; }
}
const KEY='reaction-highscores-v1';
export function validScores(value) {
  return (Array.isArray(value)?value:[]).filter(s=>s && /^[A-Z]{3}$/.test(s.initials) && Number.isInteger(s.level) && s.level>=0 && s.level<4 && Number.isInteger(s.ms) && s.ms>=80 && s.ms<=10000)
    .map(({initials,level,ms})=>({initials,level,ms})).sort((a,b)=>a.ms-b.ms).filter((s,i,all)=>all.slice(0,i).filter(x=>x.level===s.level).length<10);
}
export function readScores(storage) {try{return validScores(JSON.parse(storage.getItem(KEY)||'[]'));}catch{return [];}}
export function saveScore(storage, entry) {
  if(validScores([entry]).length!==1) return false;
  try{storage.setItem(KEY,JSON.stringify(validScores([...readScores(storage),entry])));return true;}catch{return false;}
}
