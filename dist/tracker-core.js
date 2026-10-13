export function parseTSV(text){
 const rows=[];let row=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else if(quoted||!cell.length)quoted=!quoted;else cell+=c}
 else if(!quoted&&(c==='\t'||c==='\n'||c==='\r')){row.push(cell.trim());cell='';if(c!=='\t'){if(row.some(Boolean))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++}}else cell+=c}
 if(quoted)throw Error('닫히지 않은 따옴표가 있습니다. 표 전체를 다시 선택해 주세요.');
 row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 const headers=rows.shift()||[];
 const required=['Publisher','Start Date','End Date','Placement Details'];
 if(!required.every(h=>headers.includes(h)))throw Error('Publisher, Start Date, End Date, Placement Details 열이 있는 탭 구분 표가 필요합니다.');
 return rows.map((r,i)=>{const get=k=>r[headers.indexOf(k)]||'';return {row:i+2,cid:get('CID'),publisher:get('Publisher'),quarter:get('Quarter'),start:get('Start Date'),end:get('End Date'),placement:get('Placement Details'),store:get('OBS/PS'),category:get('Category / Product'),offer:get('Offer Copy'),destination:get('Destination URL'),columnWarning:r.length!==headers.length}});
}
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases={nextjump:'Next Jump Perks',capitalone:'Capital One Shopping',idme:'ID.me Shop',benefithub:'BenefitHub',perkspot:'PerkSpot',govx:'GOVX',rakuten:'Rakuten',topcashback:'TopCashback',retailmenot:'RetailMeNot',passport:'Passport Unlimited',cartera:'Cartera Commerce'};
export function dateValue(s,year){
 const m=s.trim().match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|\d{4}))?$/);if(!m)return null;
 let y=m[3]?Number(m[3]):year;if(y<100)y+=2000;
 const mo=Number(m[1]),day=Number(m[2]),d=new Date(Date.UTC(y,mo-1,day));
 if(!y||d.getUTCFullYear()!==y||d.getUTCMonth()!==mo-1||d.getUTCDate()!==day)return null;
 return y+'-'+String(mo).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
export const labels={candidate:'브랜드·기간 후보',publisher:'퍼블리셔·기간만 일치',private:'별도 증빙 필요',blocked:'접근·표시 문제',outside:'기간 내 캡처 없음',future:'수집 기준일 이후',unmapped:'수집 퍼블리셔 없음',invalid:'날짜·행 확인 필요'};
export function reconcile(rows,snapshots,{basis='us',brand='LG',year=2026}={}){
 const captures=snapshots.flatMap(d=>d.captures.map(c=>({...c,snapshotDate:d.date,observedDate:basis==='us'?c.usDate:d.date})));
 const latest=captures.map(c=>c.observedDate).filter(Boolean).sort().at(-1)||'';
 return rows.map(row=>{
  const y=Number(row.quarter.match(/20\d{2}/)?.[0]||year),start=dateValue(row.start,y),end=dateValue(row.end,y);
  const canonical=aliases[normalize(row.publisher)]||row.publisher;
  const pubs=captures.filter(c=>normalize(c.publisher)===normalize(canonical));
  const inPeriod=pubs.filter(c=>start&&end&&c.observedDate>=start&&c.observedDate<=end);
  const good=inPeriod.filter(c=>c.status==='captured'&&c.screenshot);
  const candidates=good.filter(c=>!brand||c.brands?.some(b=>normalize(b)===normalize(brand))||normalize(c.storeBrand)===normalize(brand));
  const privatePlacement=/email|newsletter|eblast|alert|app\b|cardholder|retarget|account overview|perk alert/i.test(row.placement)||/partner store/i.test(row.store);
  let status,reason;
  if(row.columnWarning||!start||!end||start>end){status='invalid';reason='열 수 또는 시작·종료 날짜를 확인하세요.'}
  else if(start>latest&&latest){status='future';reason='보관된 캡처의 최신 날짜보다 뒤에 시작합니다.'}
  else if(!pubs.length){status='unmapped';reason='이름·별칭에 대응하는 수집 기록이 없습니다.'}
  else if(!inPeriod.length){status='outside';reason='동일 퍼블리셔는 수집했으나 집행 기간 안의 캡처가 없습니다.'}
  else if(privatePlacement){status='private';reason='이메일·알림·앱·회원 지면은 발송본 또는 해당 화면 증빙이 필요합니다.'}
  else if(!good.length){status='blocked';reason='기간 내 기록은 있으나 정상 공개 지면 캡처가 없습니다.'}
  else if(candidates.length){status='candidate';reason='브랜드 언급과 기간이 겹칩니다. 예정 위치·소재의 실제 집행은 미확인입니다.'}
  else {status='publisher';reason='퍼블리셔와 기간만 일치합니다. 대상 브랜드·상품·게재 위치는 확인되지 않았습니다.'}
  const q=Number(row.quarter.match(/Q([1-4])/i)?.[1]);
  const warning=q&&start&&Math.ceil(Number(start.slice(5,7))/3)!==q?'분기와 시작 월 불일치':'';
  return {...row,canonical,startDate:start,endDate:end,status,reason,warning,captures:inPeriod,brandCandidates:candidates.length,allPublisherCaptures:pubs.length};
 });
}
