import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Inspect the downloaded subset's actual cmap rather than just its CSS family name.
function glyphFor(bytes, point) {
  let cmap;
  for (let i=0;i<bytes.readUInt16BE(4);i++) {
    const record=12+i*16;
    if (bytes.toString('ascii',record,record+4)==='cmap') cmap=bytes.readUInt32BE(record+8);
  }
  assert.ok(cmap,'font has a cmap table');
  for (let i=0;i<bytes.readUInt16BE(cmap+2);i++) {
    const sub=cmap+bytes.readUInt32BE(cmap+4+i*8+4);
    const format=bytes.readUInt16BE(sub);
    if (format===4) {
      const count=bytes.readUInt16BE(sub+6)/2,ends=sub+14,starts=ends+count*2+2,deltas=starts+count*2,ranges=deltas+count*2;
      for (let j=0;j<count;j++) {
        const start=bytes.readUInt16BE(starts+j*2),end=bytes.readUInt16BE(ends+j*2);
        if(point<start||point>end)continue;
        const delta=bytes.readInt16BE(deltas+j*2),offset=bytes.readUInt16BE(ranges+j*2);
        if(!offset)return (point+delta)&0xffff;
        const glyph=bytes.readUInt16BE(ranges+j*2+offset+(point-start)*2);
        return glyph?(glyph+delta)&0xffff:0;
      }
    } else if (format===12) {
      for(let j=0;j<bytes.readUInt32BE(sub+12);j++) {
        const group=sub+16+j*12,start=bytes.readUInt32BE(group),end=bytes.readUInt32BE(group+4);
        if(point>=start&&point<=end)return bytes.readUInt32BE(group+8)+point-start;
      }
    }
  }
  return 0;
}
for(const [file,text] of [['noto-serif-sc-team.ttf','冷轧焊接管理组'],['ma-shan-zheng-welcome.ttf','欢迎您']]) {
  const bytes=readFileSync(new URL('../assets/fonts/'+file,import.meta.url));
  for(const character of text)assert.ok(glyphFor(bytes,character.codePointAt(0)),`${file} missing ${character}`);
}
console.log('Splash fonts: PASS (all 7 serif and 3 brush characters have nonzero glyphs)');
