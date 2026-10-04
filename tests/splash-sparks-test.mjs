import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../js/splash-sparks.js',import.meta.url),'utf8');
function run({reduce=false,noContext=false}={}) {
  let next=0, draws=0, clears=0;
  const frames=new Map(),timers=new Map(),docEvents=new Map(),winEvents=new Map(),events=new Map();
  const ctx={setTransform(){},clearRect(){clears++;},fillRect(){draws++;}};
  const canvas={width:0,height:0,getContext:()=>noContext?null:ctx};
  const rect={left:0,top:0,width:390,height:844};
  const root={isConnected:true,getBoundingClientRect:()=>rect,querySelector:s=>({getBoundingClientRect:()=>s.includes('head')?{left:120,width:12}:{left:25,top:460}}),addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
  const document={hidden:false,getElementById:n=>n==='welcome-splash'?root:canvas,addEventListener:(n,f)=>docEvents.set(n,f),removeEventListener:n=>docEvents.delete(n)};
  const window={devicePixelRatio:3,matchMedia:()=>({matches:reduce}),requestAnimationFrame:f=>{frames.set(++next,f);return next;},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(f,t)=>{timers.set(++next,{f,t});return next;},clearTimeout:id=>timers.delete(id),addEventListener:(n,f)=>winEvents.set(n,f),removeEventListener:n=>winEvents.delete(n)};
  vm.runInNewContext(source,{document,window,Math});
  function frame(t){const current=[...frames.values()];frames.clear();current.forEach(f=>f(t));}
  return {root,document,canvas,frames,timers,events,docEvents,winEvents,frame,draws:()=>draws,clears:()=>clears};
}
const normal=run();for(let t=0;t<2500;t+=17)normal.frame(t);
assert.ok(normal.draws()>100);assert.equal(normal.canvas.width,780);
assert.equal([...normal.timers.values()][0].t,3000);
[...normal.timers.values()][0].f();
assert.equal(normal.frames.size,0);assert.equal(normal.timers.size,0);
assert.equal(normal.events.size+normal.docEvents.size+normal.winEvents.size,0);
const detached=run();detached.root.isConnected=false;detached.frame(20);assert.equal(detached.frames.size,0);
const hidden=run();hidden.document.hidden=true;hidden.docEvents.get('visibilitychange')();assert.equal(hidden.frames.size,0);
assert.equal(run({reduce:true}).frames.size,0);assert.equal(run({noContext:true}).frames.size,0);
assert.doesNotMatch(source,/pointerdown|location|localStorage|sessionStorage|body\.style/);
console.log('Natural sparks: PASS (random physics, DPR cap, 3s stop, detached/hidden cleanup, reduced motion and canvas failure)');
