import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const read=f=>readFile(new URL('../'+f,import.meta.url),'utf8');
const html=await read('pages/laser-principles.html');
const branch=html.match(/<div class="entry-content defects-content">([\s\S]*?)\n          <\/div>/)[1];
const names=['未焊透','咬边','焊缝下凹（填不满）','焊缝凸起（加强高）','气孔','结瘤','搭接（错边）'];
const ids=['ce1224e0-7265-4185-a7b8-c5d3a6cd7df1','e60313f4-cf2a-494b-b518-1f8a38f20372','a25f5a93-e741-4b4b-b505-76bef11bb685','95c3074e-1aa4-4159-9036-75a206284210','ff4d3214-fe66-4016-ac08-e2a45aeebad7','133b8bb4-1cd3-46fe-89bf-87996e359871','12ff71f4-f8c3-44fa-8d27-bb0c42c9208c'];
const cards=[...branch.matchAll(/<article class="defect-card">([\s\S]*?)<\/article>/g)];
assert.equal(cards.length,7);
assert.doesNotMatch(branch,/<p|典型表现|原因|重点检查|处理方法|参数建议|base64/);
for(let i=0;i<7;i++) {
  assert.ok(cards[i][1].includes('>'+names[i]+'"')||cards[i][1].includes('alt="'+names[i]+'"'));
  assert.ok(cards[i][1].includes('<span>'+String(i+1).padStart(2,'0')+'</span> '+names[i]));
  assert.ok(cards[i][1].includes(ids[i]+'.png'));
  assert.ok(cards[i][1].includes('loading="'+(i?'lazy':'eager')+'"'));
  const data=await readFile(new URL('../assets/images/defects/'+ids[i]+'.png',import.meta.url));
  assert.equal(data.readUInt32BE(16),1536);assert.equal(data.readUInt32BE(20),1024);
  const response=await fetch('http://127.0.0.1:4182/welding-guide-home/assets/images/defects/'+ids[i]+'.png');
  assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/image\/png/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),data);
}
const sw=await read('service-worker.js'),listeners=new Map(),store=new Map();
const key=r=>typeof r==='string'?r:r.url;
const cache={addAll:async urls=>{for(const url of urls)store.set(url,{ok:true,url});},put:async()=>{}};
let offline=false,pending;
vm.runInNewContext(sw,{URL,Promise,self:{location:{href:'https://test/welding-guide-home/service-worker.js',origin:'https://test'},clients:{claim:async()=>{}},addEventListener:(n,f)=>listeners.set(n,f)},caches:{open:async()=>cache,match:async r=>store.get(key(r)),keys:async()=>[],delete:async()=>true},fetch:async()=>{if(offline)throw Error('offline');}});
listeners.get('install')({waitUntil:p=>pending=p});await pending;offline=true;
for(const id of ids){let response;listeners.get('fetch')({request:{url:'https://test/welding-guide-home/assets/images/defects/'+id+'.png',method:'GET',mode:'cors'},respondWith:p=>response=p});assert.ok((await response).ok);}
assert.match(await read('css/laser-principles.css'),/\.defect-image-button img \{[^}]*width: 100%; height: auto; object-fit: contain/);
console.log('Weld defects: PASS (7 names/images/order; unchanged 1536×1024 assets; HTTP/MIME/bytes; lazy loading; all 7 available offline)');
