import assert from 'node:assert/strict';import {promoLines,publisherLinks} from '../dist/official-core.js';
assert.equal(promoLines('Cookie privacy save 10%\nSave $500 on refrigerators')[0].type,'할인');
assert.deepEqual(promoLines('Save $500 on refrigerators')[0].categories,['냉장고']);
const p={brand:'LG',status:'captured',usDate:'2026-10-15',promotions:[{categories:['냉장고']}]};
const c={id:'x',status:'captured',screenshot:'x.jpg',brands:['LG'],usDate:'2026-10-15',title:'LG refrigerator'};
assert.equal(publisherLinks(p,{captures:[c]}).length,1);
assert.equal(publisherLinks(p,{captures:[{...c,usDate:'2026-10-14'}]}).length,0);
assert.equal(publisherLinks(p,{captures:[{...c,brands:['Samsung']}]}).length,0);
assert.equal(publisherLinks({...p,status:'challenge'},{captures:[c]}).length,0);
console.log('Official promotion extraction and same-brand/same-US-date evidence tests passed.');

assert.equal(publisherLinks(p,{captures:[{...c,storeBrand:'LG Partner Store'}]}).length,0);
