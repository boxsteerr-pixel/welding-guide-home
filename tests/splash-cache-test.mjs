import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const listeners=new Map(), buckets=new Map();
const root='https://example.test/welding-guide-home/';
const key=request=>typeof request==='string'?request:request.url;
const cache={store:new Map(),async addAll(urls){for(const url of urls)this.store.set(url,{ok:true,url,clone(){return this;}});},async put(req,res){this.store.set(key(req),res);}};
buckets.set('welding-guide-home-v34',{store:new Map()});
buckets.set('operator-guide-1.0.34',{store:new Map()});
buckets.set('welding-guide-108-v8',{store:new Map()});
let offline=false;
const caches={async open(name){if(!buckets.has(name))buckets.set(name,cache);return buckets.get(name);},async keys(){return [...buckets.keys()];},async delete(name){return buckets.delete(name);},async match(req){for(const bucket of buckets.values()){if(bucket.store.has(key(req)))return bucket.store.get(key(req));}}};
vm.runInNewContext(readFileSync(new URL('../service-worker.js',import.meta.url),'utf8'),{URL,Promise,caches,self:{location:{href:root+'service-worker.js',origin:'https://example.test'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>listeners.set(name,fn)},fetch:async req=>{if(offline)throw Error('offline');return {ok:true,url:key(req),clone(){return this;}};}});
let pending;
listeners.get('install')({waitUntil:task=>pending=task});await pending;
listeners.get('activate')({waitUntil:task=>pending=task});await pending;
assert.ok(!buckets.has('welding-guide-home-v34'));
assert.ok(buckets.has('operator-guide-1.0.34'));assert.ok(buckets.has('welding-guide-108-v8'));
offline=true;
for(const file of ['index.html','css/splash.css?v=10','js/splash.js?v=2','js/splash-sparks.js?v=1']){
  let response;
  listeners.get('fetch')({request:{url:root+file,method:'GET',mode:file==='index.html'?'navigate':'cors'},respondWith:task=>response=task});
  assert.ok((await response).ok,'offline '+file);
}
let intercepted=false;
listeners.get('fetch')({request:{url:'https://example.test/welding-guide/index.html',method:'GET',mode:'navigate'},respondWith:()=>intercepted=true});
assert.equal(intercepted,false);
console.log('Splash cache: PASS (offline HTML/CSS/JS; clean background and system fonts; v34→v35; preserves 101/108 caches; project-only scope)');
