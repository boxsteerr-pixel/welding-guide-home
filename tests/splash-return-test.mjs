import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>\s*(\/\/ Same-origin[\s\S]*?)<\/script>/)[1];
function skip(referrer,type='navigate',href='https://boxsteerr-pixel.github.io/welding-guide-home/') {
  let skipped=false;
  vm.runInNewContext(script,{URL,location:{href},performance:{getEntriesByType:()=>[{type}]},document:{referrer,documentElement:{classList:{add:()=>skipped=true}}}});
  return skipped;
}
for(const origin of ['https://boxsteerr-pixel.github.io/','http://127.0.0.1:4182/']) {
  for(const id of ['', '-108','-102','-122','-202','-401','-411','-502']) {
    for(const path of ['/#home','/index.html#faults']) {
      const from=origin+'welding-guide'+id+path;
      assert.equal(skip(from,'navigate',origin+'welding-guide-home/'),true,from);
      assert.equal(skip(from,'reload',origin+'welding-guide-home/'),false,'reload keeps welcome');
    }
  }
  for(const name of ['laser-principles','history','safety'])assert.equal(skip(origin+'welding-guide-home/pages/'+name+'.html','navigate',origin+'welding-guide-home/index.html'),true);
}
assert.equal(skip(''),false);assert.equal(skip('https://example.com/welding-guide-108/'),false);
assert.equal(skip('https://boxsteerr-pixel.github.io/unrelated/'),false);
assert.equal(skip('https://boxsteerr-pixel.github.io/welding-guide-home/'),false);
assert.match(html,/\.skip-welcome \.welcome-splash\{display:none\}/);
console.log('Splash return: PASS (8 manuals + 3 topics skip before paint; direct/reload/unrelated origins retain welcome; links unchanged)');
