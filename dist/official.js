import {publisherLinks} from './official-core.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected=null,older=null,publisher=null,version=0;
const names={captured:'공개 화면 수집',error:'수집 실패',challenge:'보안 확인 화면',render_failed:'표시 불완전',wrong_market:'미국 경로 확인 실패'};
export async function renderOfficial(data){
 publisher=data;const token=++version;
 try{
 const r=await fetch('./data/official/index.json',{cache:'no-store'});if(!r.ok)throw Error();const dates=(await r.json()).dates.filter(d=>d<=data.date).sort();
 const date=dates.at(-1);
 if(!date){selected=null;older=null;draw();return}
 const response=await fetch('./data/official/'+date+'.json');if(!response.ok)throw Error();const current=await response.json();
 let prev=null;if(dates.length>1){const p=await fetch('./data/official/'+dates.at(-2)+'.json');if(p.ok())prev=await p.json()}
 if(token!==version)return;selected=current;older=prev;draw();
 }catch{if(token===version){selected=null;older=null;draw();$('#officialDate').textContent='공식몰 기록을 불러오지 못했습니다.'}}
}
function evidence(p){return (p.screenshot?'<a href="./'+esc(p.screenshot)+'" target="_blank" rel="noopener noreferrer">저장 화면 ↗</a> · ':'')+'<a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer">공식 원문 ↗</a>'}
function draw(){
 if(!selected){
 $('#officialDate').textContent='선택일 이전의 공식몰 수집 기록 없음';
 $('#officialCards').innerHTML='<p class="empty-state">공식몰 수집은 이번 기능 추가일부터 시작합니다. 과거 날짜의 혜택을 현재 값으로 채우지 않습니다.</p>';
 $('#officialConnections').innerHTML='';$('#officialSummary').innerHTML='<p class="muted">선택일의 공식몰 기록이 없습니다. 공식몰 탭에서 수집 범위를 확인하세요.</p>';return;
 }
 $('#officialDate').textContent='공식몰 관측 '+selected.date+' · 퍼블리셔 관측 '+publisher.date+(selected.date!==publisher.date?' · 공식몰은 최근 이전 기록':'');
 const brand=$('#officialBrand').value,category=$('#officialCategory').value,type=$('#officialType').value;
 const pages=selected.pages.filter(p=>!brand||p.brand===brand);
 const summary=['LG','Samsung'].map(b=>{
 const ps=selected.pages.filter(p=>p.brand===b),ok=ps.filter(p=>p.status==='captured'),connections=[...new Set(ok.flatMap(p=>publisherLinks(p,publisher).map(l=>l.capture.publisher)))];
 return '<div class="official-brief"><span class="tag">'+b+' US</span><h3>'+ok.length+' / '+ps.length+'개 공식 지면 수집</h3><p>'+ok.reduce((n,p)=>n+p.promotions.length,0)+'개 혜택 문구 후보 · '+connections.length+'개 퍼블리셔 연결 후보</p><small>'+esc(connections.join(' · ')||'같은 미국 동부 날짜의 브랜드 지면 없음')+'</small><p class="muted">공식몰 '+selected.date+' / 지면 '+publisher.date+' · 합산 혜택·중복 적용 미확인</p></div>';
 }).join('');
 $('#officialSummary').innerHTML=summary;
 $('#officialCards').innerHTML=pages.map(p=>{
 const old=older?.pages.find(x=>x.id===p.id&&x.status==='captured');
 const promos=p.promotions.filter(o=>(!category||o.categories.includes(category))&&(!type||o.type===type));
 const added=old&&p.status==='captured'?p.promotions.filter(o=>!old.promotions.some(x=>x.text===o.text)).length:null;
 return '<article class="panel official-card"><div class="section-top"><div><span class="eyebrow">'+p.brand+' · US OFFICIAL</span><h2>'+esc(p.label)+'</h2></div><span class="badge">'+esc(names[p.status]||p.status)+'</span></div><p class="muted">'+esc(p.capturedAt)+' · 미국 날짜 '+esc(p.usDate)+' · '+(p.usIpVerified?'US IP 확인':'US IP 미검증')+'</p>'+
 (p.screenshot?'<a href="./'+esc(p.screenshot)+'" target="_blank" rel="noopener noreferrer"><img class="official-shot" loading="lazy" src="./'+esc(p.screenshot)+'" alt="'+esc(p.label)+' 실제 캡처"></a>':'')+
 '<div class="official-links">'+evidence(p)+'</div><p class="muted">'+(added===null?'문구 변화 비교 대기':older.date+' 대비 추가·변경된 문구 후보 '+added+'개 · 노출 순서·동적 콘텐츠 영향 포함')+'</p>'+
 (promos.length?promos.map(o=>'<details class="promo-item"><summary><span class="tag pending">'+esc(o.type)+'</span> '+esc(o.text)+'</summary><p>'+esc(o.context)+'</p><small>'+esc(o.categories.join(' · ')||'상품군 미분류')+' · 자동 추출 / 적용 기간·모델·제외 조건 검토 필요</small></details>').join(''):'<p class="muted">'+(p.status==='captured'?'필터에 맞는 혜택 문구 없음. 원문·캡처를 확인하세요.':'접근·표시 문제로 혜택을 추출하지 않았습니다.')+'</p>')+'</article>';
 }).join('');
 $('#officialConnections').innerHTML=pages.filter(p=>p.status==='captured').map(p=>{
 const links=publisherLinks(p,publisher);
 return '<article class="panel"><h3>'+esc(p.label)+' → 퍼블리셔 지면</h3><p class="muted">같은 미국 동부 관측일·브랜드 기준입니다. 동일 캠페인·상품 모델·중복 적용이 확인된 연결은 아닙니다.</p>'+
 (links.length?'<div class="table-wrap"><table><thead><tr><th>퍼블리셔</th><th>연결 근거</th><th>연결해서 확인할 것</th><th>화면</th></tr></thead><tbody>'+links.map(l=>'<tr><td>'+esc(l.capture.publisher)+'</td><td>'+esc(l.level)+'<small>'+esc(l.common.join(' · '))+'</small></td><td>공식몰 대상 모델·기간 ↔ 캐시백 제외 품목·쿠폰 허용·회원 조건</td><td><button class="text-button" data-id="'+esc(l.capture.id)+'">지면 근거 ↗</button></td></tr>').join('')+'</tbody></table></div>':'<p>같은 관측일의 브랜드 지면이 없습니다.</p>')+'</article>';
 }).join('');
}
export function initOfficial(){['officialBrand','officialCategory','officialType'].forEach(id=>$('#'+id).addEventListener('change',draw))}
