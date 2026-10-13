
// Conservative candidates: only explicit cashback/reward text in a brand-store title.
// Coupon discounts and ambiguous homepage mentions never become cashback rates.
export function extractRate(c){
 if(c.status!=='captured')return null;
 let host;try{host=new URL(c.url).hostname}catch{return null}
 const allowed=['rakuten.com','www.rakuten.com','www.befrugal.com','befrugal.com'];
 if(!allowed.includes(host))return null;
 const brand=c.storeBrand||(['GE Appliances','LG Partner Store','Whirlpool','Frigidaire','Samsung','Dyson','LG','Sony','Best Buy',"Lowe's"].find(b=>new RegExp('\\b'+b+'\\b','i').test(c.title||'')));
 if(!brand)return null;
 const m=(c.title||'').match(/\b(up to\s+)?(\d+(?:\.\d+)?)%\s*cash\s*back\b/i);
 if(!m||Number(m[2])>100)return null;
 return {captureId:c.id,brand,type:'cashback',rate:Number(m[2]),isMaximum:!!m[1],value:(m[1]?'최대 ':'')+m[2]+'%',conditions:'화면 제목에서 자동 추출 · 적용 품목·제외 조건 미검토',verified:false,evidence:m[0],category:'브랜드 상점',storeClass:/partner/i.test(brand)?'partner':'public'};
}
export function offersFor(d){
 const reviewed=(d.activities||[]).filter(a=>a.verified&&Number.isFinite(a.rate)&&['cashback','reward'].includes(a.type)).map(a=>({...a,isMaximum:/최대|up to/i.test(a.value),storeClass:'public'}));
 const candidates=d.captures.map(extractRate).filter(Boolean).filter(a=>!reviewed.some(r=>r.captureId===a.captureId&&r.type===a.type));
 return [...reviewed,...candidates].map(a=>({...a,publisher:d.captures.find(c=>c.id===a.captureId)?.publisher||''}));
}
export function lgDelta(a,offers){
 if(a.brand==='LG')return '기준';
 const lg=offers.find(b=>b.brand==='LG'&&b.publisher===a.publisher&&b.type===a.type&&b.storeClass===a.storeClass&&b.isMaximum===a.isMaximum);
 if(!lg)return '동일 기준 LG 없음';
 const n=Math.round((a.rate-lg.rate)*100)/100;
 return (n>0?'+':'')+n+'%p · 표시값 차이';
}
export function rateChanges(now,old){
 if(!old)return [];
 const previous=offersFor(old);
 return offersFor(now).map(a=>({a,p:previous.find(p=>p.captureId===a.captureId&&p.brand===a.brand&&p.type===a.type&&p.isMaximum===a.isMaximum)})).filter(({a,p})=>p&&a.rate!==p.rate);
}
