import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const dates=JSON.parse(await fs.readFile('dist/data/index.json','utf8')).dates;
assert(dates.length>0);assert.equal(new Set(dates).size,dates.length);
for(const date of dates){
 assert.match(date,/^\d{4}-\d{2}-\d{2}$/);
 const d=JSON.parse(await fs.readFile('dist/data/'+date+'.json','utf8'));
 assert.equal(d.date,date);assert.equal(d.registry.length,275);
 assert.equal(new Set(d.captures.map(c=>c.id)).size,d.captures.length);
 for(const c of d.captures){
  assert(['captured','entry_only','challenge','render_failed','policy_blocked','not_found','error','robots_disallowed'].includes(c.status));
  assert.match(c.url,/^https:\/\//);assert(Number.isFinite(Date.parse(c.capturedAt)));
  if(c.screenshot){assert.match(c.screenshot,/^captures\/[\w/.-]+\.jpg$/);assert(!c.screenshot.includes('..'));const b=await fs.readFile('dist/'+c.screenshot);assert(b.length>100);assert.equal(b[0],255);assert.equal(b[1],216);}
 }
 for(const a of d.activities){const c=d.captures.find(c=>c.id===a.captureId);assert(c&&c.status==='captured');assert(a.verified);assert(c.reviewed);}
 for(const r of d.registry)for(const id of r.captureIds)assert(d.captures.some(c=>c.id===id));
 assert(!/cj매출|커미션|ga매출|ROAS|고객명|order.?id/i.test(JSON.stringify(d)));
 console.log(date+': '+d.captures.length+' outcomes, '+d.activities.length+' reviewed signals, 275 source names verified.');
}

const officialIndex=JSON.parse(await fs.readFile('dist/data/official/index.json','utf8'));
for(const date of officialIndex.dates){
 const d=JSON.parse(await fs.readFile('dist/data/official/'+date+'.json','utf8'));assert.equal(d.date,date);assert.equal(d.pages.length,4);
 for(const p of d.pages){
  assert(['LG','Samsung'].includes(p.brand));assert(Number.isFinite(Date.parse(p.capturedAt)));
  assert(['captured','error','challenge','render_failed','wrong_market'].includes(p.status));
  assert(p.promotions.length<=12);if(p.status!=='captured')assert.equal(p.promotions.length,0);
  if(p.screenshot){assert.match(p.screenshot,/^captures\/official\/[\w/.-]+\.jpg$/);assert(!p.screenshot.includes('..'));const b=await fs.readFile('dist/'+p.screenshot);assert(b.length>100);assert.equal(b[0],255);assert.equal(b[1],216)}
 }
 console.log(date+': official store evidence verified.');
}
