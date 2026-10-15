export function categoryOf(text=''){
 const rules=[['냉장고',/refrigerat|fridge/i],['세탁',/laundry|washer|dryer|washtower/i],['식기세척기',/dishwasher/i],['조리',/range|oven|cooktop|cooking/i],['TV·오디오',/\btv\b|oled|qned|soundbar|television/i],['모니터·PC',/monitor|laptop|\bpc\b/i],['청소·공기관리',/vacuum|purifier|air care/i]];
 return rules.filter(([,r])=>r.test(text)).map(([n])=>n);
}
export function promoLines(text){
 const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
 const selected=[];
 for(let i=0;i<lines.length;i++){
 const s=lines[i];if(s.length<8||s.length>350||!/(save|off\b|cash\s*back|rebate|free|bundle|warranty|financing)/i.test(s)||!(/[$%]|\bfree\b|bundle|warranty/i.test(s)))continue;
 if(/cookie|privacy|sign up|subscribe|copyright/i.test(s))continue;
 if(selected.some(x=>x.text===s))continue;
 const context=lines.slice(Math.max(0,i-1),i+3).join(' ').slice(0,650);
 selected.push({text:s,context,categories:categoryOf(context),type:/cash\s*back/i.test(s)?'캐시백':/rebate/i.test(s)?'리베이트':/warranty/i.test(s)?'보증':/financing/i.test(s)?'금융 혜택':/bundle/i.test(s)?'번들':/\bfree\b/i.test(s)?'무료 혜택':'할인',reviewed:false});
 if(selected.length===12)break;
 }
 return selected;
}
export function publisherLinks(official,publisherData){
 if(official.status!=='captured')return [];
 return publisherData.captures.filter(c=>c.status==='captured'&&c.screenshot&&c.usDate===official.usDate&&(c.storeBrand===official.brand||c.brands?.includes(official.brand))).map(c=>{
 const categories=categoryOf([c.title,c.note,...(publisherData.activities||[]).filter(a=>a.captureId===c.id).map(a=>a.summary+' '+a.category)].join(' '));
 const common=categories.filter(k=>official.promotions.some(p=>p.categories.includes(k)));
 return {capture:c,common,level:common.length?'브랜드·관측일·상품군 후보':'브랜드·관측일 후보'};
 });
}
