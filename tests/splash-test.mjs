import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read = file => readFileSync(new URL('../'+file, import.meta.url),'utf8');
const source = read('js/splash.js');
function harness({hidden=false,missingNumber=false,brokenFade=false,backNavigation=false}={}) {
  let now=0, id=0;
  const pending=new Map(), events=new Map(), docEvents=new Map(), winEvents=new Map();
  const number={textContent:'3'};
  const splash={remove(){this.removed=true;},classList:{add(name){if(brokenFade)throw Error('animation failed');splash.leaving=name;}},addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)};
  const document={hidden,getElementById:name=>name==='welcome-splash'?splash:missingNumber?null:number,addEventListener:(name,fn)=>docEvents.set(name,fn),removeEventListener:name=>docEvents.delete(name)};
  const window={performance:{getEntriesByType:()=>[{type:backNavigation?'back_forward':'navigate'}]},setTimeout(fn,delay){pending.set(++id,{fn,at:now+delay});return id;},clearTimeout:id=>pending.delete(id),addEventListener:(name,fn)=>winEvents.set(name,fn),removeEventListener:name=>winEvents.delete(name)};
  vm.runInNewContext(source,{document,window,Set});
  function tick(time){for(;;){const next=[...pending.entries()].filter(([,t])=>t.at<=time).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;pending.delete(next[0]);try{next[1].fn();}catch{}}now=time;}
  return {splash,number,pending,events,docEvents,winEvents,document,tick};
}
const normal=harness();
assert.equal(normal.number.textContent,'3');
normal.tick(999);assert.equal(normal.number.textContent,'3');
normal.tick(1000);assert.equal(normal.number.textContent,'2');
normal.tick(2000);assert.equal(normal.number.textContent,'1');
normal.tick(3000);assert.equal(normal.splash.leaving,'welcome-splash--leaving');
normal.tick(3500);assert.equal(normal.splash.removed,true);assert.equal(normal.pending.size,0);
assert.equal(normal.docEvents.size,0);assert.equal(normal.winEvents.size,0);assert.equal(normal.events.size,0);
const background=harness();background.document.hidden=true;background.docEvents.get('visibilitychange')();
assert.equal(background.splash.removed,true);assert.equal(background.pending.size,0);
const back=harness();back.winEvents.get('pagehide')();assert.equal(back.splash.removed,true);
assert.equal(harness({hidden:true}).pending.size,0);
assert.equal(harness({missingNumber:true}).splash.removed,true);
assert.equal(harness({backNavigation:true}).splash.removed,true);
const broken=harness({brokenFade:true});broken.tick(4500);assert.equal(broken.splash.removed,true);
const html=read('index.html'),css=read('css/splash.css'),sw=read('service-worker.js');
assert.match(html, /splash-emergency-exit .01s 4.8s forwards/);
assert.match(html, /<noscript><style>\.welcome-splash\{display:none\}/);
const markup=html.slice(html.indexOf('  <div class="welcome-splash"'),html.indexOf('  <a class="skip-link"'));
for(const word of ['冷轧焊接管理组','欢迎您','即将进入手册…'])assert.ok(markup.includes(word));
assert.match(markup, /<span>欢<\/span><span>迎<\/span><span>您<\/span>/);
assert.match(css, /Splash Team Serif/);assert.match(css, /Splash Welcome Brush/);
assert.match(css, /font-display:swap/);assert.match(css, /animation-delay:\.52s/);assert.match(css, /animation-delay:\.64s/);
assert.match(css, /welcome-splash__title span,\.welcome-splash__background/);
assert.doesNotMatch(css, /https?:\/\//);
assert.doesNotMatch(markup, /<button|<a\s/);
assert.match(css,/100dvh|9dvh/);assert.match(html,/height:100vh;height:100dvh/);
assert.match(css,/safe-area-inset-top/);assert.match(css,/safe-area-inset-bottom/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.doesNotMatch(source,/location|localStorage|sessionStorage|history\.|body\.style/);
for(const file of ['css/splash.css?v=4','js/splash.js?v=2','assets/images/splash-background.webp','assets/fonts/noto-serif-sc-team.ttf','assets/fonts/ma-shan-zheng-welcome.ttf'])assert.ok(sw.includes('./'+file));
for(const file of ['assets/fonts/noto-serif-sc-team.ttf','assets/fonts/ma-shan-zheng-welcome.ttf']) {
  const bytes=readFileSync(new URL('../'+file,import.meta.url));
  assert.equal(bytes.readUInt32BE(0),0x00010000,'valid TTF');assert.ok(bytes.length<12000,'lightweight font subset');
}
assert.match(sw,/welding-guide-home-v34/);assert.match(sw,/name.startsWith\("welding-guide-home-"\)/);
const manifest=JSON.parse(read('manifest.json'));assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
console.log('Splash: PASS (3→2→1, 3s fade, 3.5s removal, timers/listeners cleanup, hidden/pagehide, 4.5s failsafe, no JS fallback, isolated markup/styles, PWA paths)');
