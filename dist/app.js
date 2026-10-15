import {renderOfficial,initOfficial} from './official.js?v=20261015b';
import {initTracker} from './tracker.js';
import {labels as trackerLabels} from './tracker-core.js';
import {offersFor,lgDelta,rateChanges} from './insights.js';
let data, previousData=null, historyData=[], loadVersion=0, allDates=[], currentView='overview';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses={captured:'공개 지면 캡처',entry_only:'공개 입구만 확인',challenge:'보안 확인 화면',render_failed:'렌더링 불완전',policy_blocked:'정책상 접근 제한',not_found:'페이지 없음',error:'수집 실패',robots_disallowed:'자동 수집 제한'};
const modes={registered:'선정 지면 있음',app_extension:'앱·확장프로그램',membership:'회원·폐쇄몰',non_web:'영상·오디오·광고망',unresolved_id:'식별자 확인 필요',unmapped:'도메인 매핑 필요'};
const types={cashback:'캐시백',membership:'자격 할인',deal:'상품 딜',editorial:'편집 콘텐츠'};
const kst=t=>new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t));
function toast(t){$('#toast').textContent=t;$('#toast').hidden=false;setTimeout(()=>$('#toast').hidden=true,5000)}
function view(v){if(!['overview','captures','coverage','method','tracker','official'].includes(v))v='overview';currentView=v;document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==v);document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===v));$('#viewTitle').textContent={overview:'LG와 경쟁사, 오늘 무엇이 달라졌나요?',captures:'실제 화면으로 확인하는 지면',coverage:'얼마나 확인했고, 무엇이 남았나요?',official:'공식몰 혜택과 퍼블리셔 지면을 함께',tracker:'예정된 지면, 실제로 수집됐나요?',method:'관측의 기준을 투명하게'}[v];$('#subtitle').textContent={overview:'같은 퍼블리셔의 혜택을 비교하고, 변화를 실제 화면으로 확인하세요.',captures:'수집 성공과 실패, 공개 입구까지 같은 기준으로 기록합니다.',coverage:'기존 분석 대상명 275개를 수집 결과와 대조합니다.',official:'LG·Samsung 프로모션을 확인하고 같은 날 관측된 지면과 연결하세요.',tracker:'집행 예정표의 각 행을 캡처 근거와 대조합니다.',method:'공개 화면, 미국 접속 검증, 일별 기록의 범위와 한계.'}[v];history.replaceState(null,'','#'+v);}
document.querySelectorAll('[data-view],[data-go]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();view(el.dataset.view||el.dataset.go)}));
function captureCard(c){return '<button class="capture-card" data-id="'+esc(c.id)+'" aria-label="'+esc(c.publisher+' '+c.title+' 캡처 상세')+'"><div class="capture-image">'+(c.screenshot?'<img loading="lazy" src="./'+esc(c.screenshot)+'" alt="'+esc(c.publisher+' 실제 수집 화면')+'">':'<div class="no-image">⊘<span>이미지 미수집</span></div>')+'<span class="status '+(c.status==='captured'?'':'warning')+'">'+esc(statuses[c.status]||c.status)+'</span></div><div class="card-body"><div class="card-top"><h3>'+esc(c.publisher)+'</h3><span>'+esc(c.kind)+'</span></div><p>'+esc(c.note)+'</p><div class="card-bottom">'+c.brands.slice(0,3).map(b=>'<span class="tag">'+esc(b)+'</span>').join('')+'<time>'+kst(c.capturedAt)+' KST ↗</time></div></div></button>'}

function filteredCaptures(){
 const p=$('#globalPublisher').value,b=$('#globalBrand').value;
 return data.captures.filter(c=>(!p||c.publisher===p)&&(!b||c.brands.includes(b)||offersFor(data).some(a=>a.captureId===c.id&&a.brand===b)));
}
function render(){
 const scoped=filteredCaptures(), ids=new Set(scoped.map(c=>c.id)), good=scoped.filter(c=>c.status==='captured');
 const allOffers=offersFor(data), offers=allOffers.filter(a=>ids.has(a.captureId)&&(!$('#globalBrand').value||a.brand===$('#globalBrand').value));
 const reviewed=(data.activities||[]).filter(a=>ids.has(a.captureId)&&a.verified&&(!$('#globalBrand').value||a.brand===$('#globalBrand').value));
 $('#navCount').textContent=data.captures.length;$('#displayDate').textContent=data.date.replaceAll('-','.');
 $('#lastCapture').textContent='최근 캡처 '+kst(data.captures.map(c=>c.capturedAt).sort().at(-1))+' KST';
 const metrics=[['점검한 퍼블리셔',new Set(scoped.map(c=>c.publisher)).size,'개','필터에 해당하는 선정 지면'],['저장된 화면',scoped.filter(c=>c.screenshot).length,'장','정상 공개 지면 '+good.length+'개'],['요율 확인 지면',new Set(offers.map(a=>a.captureId)).size,'개','자동 추출 포함 · 조건 검토 별도'],['검토된 활동',reviewed.length,'건','선택일의 검토 기록만 표시']];
 $('#metrics').innerHTML=metrics.map(([l,n,u,d])=>'<div class="metric"><div class="label">'+l+'</div><div class="value">'+n+'<span>'+u+'</span></div><div class="desc">'+d+'</div></div>').join('');
 const changes=rateChanges(data,previousData).filter(({a})=>offers.some(o=>o.captureId===a.captureId&&o.brand===a.brand));
 $('#changesDate').textContent=previousData?previousData.date+' → '+data.date:'이전 관측 없음';
 $('#changesSummary').textContent=!previousData?'비교 대기':changes.length?'표시 요율 변화 '+changes.length+'건':'비교 가능한 요율에서 변화 미감지';
 const pairs=previousData?offers.filter(a=>offersFor(previousData).some(p=>p.captureId===a.captureId&&p.type===a.type&&p.brand===a.brand&&p.isMaximum===a.isMaximum)).length:0;
 if(previousData&&!pairs)$('#changesSummary').textContent='비교 대기 · 동일 기준 요율 없음';
 $('#changes').innerHTML=changes.map(({a,p})=>{
  const c=data.captures.find(c=>c.id===a.captureId),old=previousData.captures.find(c=>c.id===p.captureId),diff=Math.round((a.rate-p.rate)*100)/100;
  return '<div class="change-item"><div><span class="tag">'+esc(a.publisher)+' · '+esc(a.brand)+'</span><h3>'+esc(p.value)+' → '+esc(a.value)+' <span class="'+(diff>0?'up':'down')+'">'+(diff>0?'+':'')+diff+'%p</span></h3><p>'+esc(a.verified&&p.verified?'검토된 표시값 변화':'자동 추출 포함 · 조건 확인 필요')+'</p></div><div><button class="outline" data-id="'+esc(c.id)+'">현재 근거 ↗</button>'+(old?.screenshot?'<a class="text-button" href="./'+esc(old.screenshot)+'" target="_blank" rel="noopener noreferrer">이전 화면 ↗</a>':'')+'</div></div>';
 }).join('')+'<p class="muted">'+(previousData?'이전 관측과 비교 가능한 '+pairs+'개 요율 기준입니다. 추출 실패·미수집은 0%나 혜택 종료로 계산하지 않습니다.':'이전 날짜가 쌓이면 비교합니다. 화면의 “was” 문구는 전일 관측값으로 사용하지 않습니다.')+'</p>';
 $('#rateComparison').innerHTML=offers.length?'<table><thead><tr><th>퍼블리셔 / 브랜드</th><th>혜택 유형</th><th>표시 요율</th><th>같은 퍼블리셔 LG 대비</th><th>검증·적용 조건</th><th>근거</th></tr></thead><tbody>'+offers.sort((a,b)=>a.publisher.localeCompare(b.publisher)||(a.brand==='LG'?-1:b.brand==='LG'?1:a.brand.localeCompare(b.brand))).map(a=>'<tr class="'+(a.brand==='LG'?'lg-row':'')+'"><td>'+esc(a.publisher)+'<strong>'+esc(a.brand)+'</strong></td><td>'+esc(a.type==='reward'?'리워드':'캐시백')+'</td><td class="rate-number">'+esc(a.value)+'</td><td>'+esc(lgDelta(a,allOffers))+'</td><td><span class="tag '+(a.verified?'':'pending')+'">'+(a.verified?'표시 문구 검토':'자동 추출 · 미검토')+'</span><small>'+esc(a.conditions)+'</small></td><td><button class="text-button" data-id="'+esc(a.captureId)+'">화면 ↗</button></td></tr>').join('')+'</tbody></table>':'<div class="empty-state">선택한 조건의 요율 기록이 없습니다. 캡처 보드에서 실제 화면을 확인할 수 있습니다.</div>';
 const others=reviewed.filter(a=>!['cashback','reward'].includes(a.type));
 $('#otherOffers').innerHTML=others.length?others.map(a=>'<div class="other-offer"><span class="tag">'+esc(types[a.type]||a.type)+'</span><b>'+esc(a.brand)+' · '+esc(a.value)+'</b><p>'+esc(a.summary)+'</p><small>'+esc(a.conditions)+'</small><button class="text-button" data-id="'+esc(a.captureId)+'">근거 ↗</button></div>').join(''):'<p class="muted">선택일의 쿠폰·회원 할인·상품 딜은 검토 대기입니다. 캐시백 요율과 합산하거나 대신 비교하지 않습니다.</p>';
 const faults=scoped.filter(c=>c.status!=='captured');
 $('#quality').innerHTML=[['접속 응답 확인',scoped.filter(c=>c.httpStatus>=200&&c.httpStatus<400).length,'HTTP 상태가 기록된 결과만'],['화면 저장',scoped.filter(c=>c.screenshot).length,'오류·입구 화면 포함'],['정상 공개 지면',good.length,'회원 입구·차단 제외'],['요율 기록 지면',new Set(offers.map(a=>a.captureId)).size,'자동 추출 + 검토된 값'],['문구 검토 지면',new Set(reviewed.map(a=>a.captureId)).size,'구매 적용 검증과는 별도']].map(([l,n,h])=>'<div><span>'+l+'</span><b>'+n+'<small> / '+scoped.length+'</small></b><small>'+h+'</small></div>').join('');
 $('#issues').innerHTML=faults.length?faults.map(c=>'<button class="issue-chip" data-id="'+esc(c.id)+'">'+esc(c.publisher)+' · '+esc(statuses[c.status])+' ↗</button>').join(''):'<p class="muted">선택한 지면에서 수집 오류가 없습니다.</p>';
 $('#spotlight').innerHTML=good.slice(0,3).map(captureCard).join('')||'<p class="muted">선택한 조건의 공개 캡처가 없습니다.</p>';
 $('#coverageBars').innerHTML=Object.entries(modes).map(([k,l])=>'<div><b>'+data.registry.filter(r=>r.mode===k).length+'</b><span>'+l+'</span></div>').join('');
 $('#historyNote').textContent=previousData?'본문·수집 상태 변화입니다. 요율 인상 또는 광고 변경과는 다를 수 있습니다.':'첫 번째 관측일입니다. 이전 기록이 없어 비교 대기 중입니다.';
 $('#comparison').innerHTML='';
 const verified=data.captures.filter(c=>c.usIpVerified).length;
 $('.notice b').textContent=verified===data.captures.length?'미국 IP 확인 환경의 공개 지면 표본':'미국 대상 지면 표본 · 미국 IP 접속은 '+(verified?'일부 확인':'미검증');
 $('.notice p').textContent=verified===data.captures.length?'접속 국가 US 확인 · 비로그인 표본이며 개인화에 따라 화면이 다를 수 있습니다.':'접속 국가가 확인되지 않은 결과를 미국 사용자 화면으로 확정하지 않습니다.';
 $('#footerStatus').textContent=data.date+' · US IP 확인 '+verified+'/'+data.captures.length;
 $('#scheduleText').textContent=data.collection.schedule+' · 현재 일별 예약 활성화';
 gallery();registryRender();renderTrend();renderOfficial(data);
}
function renderTrend(){
 const rows=historyData.filter(d=>d.date<=data.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14), p=$('#globalPublisher').value,b=$('#globalBrand').value;
 const keys=new Map();
 rows.forEach(d=>offersFor(d).filter(a=>(!p||a.publisher===p)&&(!b||a.brand===b)).forEach(a=>keys.set(a.captureId+'|'+a.brand+'|'+a.type+'|'+a.isMaximum,a)));
 $('#trend').innerHTML=rows.length<2?'<p class="muted">추이 비교 대기 · 관측일이 2일 이상 필요합니다.</p>':'<div class="table-wrap"><table><thead><tr><th>퍼블리셔 · 브랜드</th>'+rows.map(d=>'<th>'+esc(d.date)+'</th>').join('')+'</tr></thead><tbody>'+[...keys].map(([key,a])=>'<tr><td>'+esc(a.publisher)+'<strong>'+esc(a.brand)+(a.isMaximum?' · 최대치':'')+'</strong></td>'+rows.map(d=>{const x=offersFor(d).find(o=>o.captureId+'|'+o.brand+'|'+o.type+'|'+o.isMaximum===key);return '<td>'+(x?'<button class="text-button" data-history-date="'+d.date+'" data-history-id="'+esc(x.captureId)+'">'+esc(x.value)+(x.verified?'':' *')+'</button>':'<span class="muted">미확인</span>')+'</td>';}).join('')+'</tr>').join('')+'</tbody></table></div><p class="muted">* 자동 추출 · 조건 미검토. 최대치와 일반 표시값을 별도 행으로 기록합니다. 미확인은 0%가 아닙니다. 값을 누르면 해당 날짜의 근거를 엽니다.</p>';
}
function gallery(){const q=$('#search').value.toLowerCase(),b=$('#globalBrand').value,s=$('#status').value,k=$('#kind').value;const rows=filteredCaptures().filter(c=>(!q||[c.publisher,c.title,c.url,c.note,...c.brands].join(' ').toLowerCase().includes(q))&&(!s||c.status===s)&&(!k||c.kind===k));$('#resultCount').textContent='선정 지면 '+rows.length+'개';$('#gallery').innerHTML=rows.length?rows.map(captureCard).join(''):'<div class="empty-state">조건에 맞는 캡처가 없습니다. 검색어 또는 필터를 변경하세요.</div>';}
function registryRender(){const q=$('#registrySearch').value.toLowerCase(),m=$('#registryMode').value;const rows=data.registry.filter(r=>(!q||(r.name+' '+r.canonical).toLowerCase().includes(q))&&(!m||r.mode===m));$('#registryCount').textContent=rows.length+' / '+data.registry.length+'개 원문명';$('#registryRows').innerHTML=rows.map(r=>{const cs=data.captures.filter(c=>r.captureIds.includes(c.id));return '<tr><td>'+esc(r.name)+'</td><td>'+esc(r.canonical)+'<small>'+esc(r.mapping)+'</small></td><td>'+esc(modes[r.mode])+'</td><td>'+(cs.length?cs.map(c=>'<button class="text-button" data-id="'+esc(c.id)+'">'+esc(statuses[c.status])+' ↗</button>').join(' · '):esc(r.note))+'</td></tr>'}).join('');}
function detail(id){const c=data.captures.find(c=>c.id===id);if(!c)return;$('#detailType').textContent=c.kind+' · '+statuses[c.status];$('#detailTitle').textContent=c.publisher;$('#detailContent').innerHTML=(c.screenshot?'<a href="./'+esc(c.screenshot)+'" target="_blank" rel="noopener noreferrer"><img src="./'+esc(c.screenshot)+'" alt="'+esc(c.publisher)+' 실제 화면"></a>':'<div class="empty-state">정책상 접근 제한으로 캡처 이미지가 없습니다.</div>')+'<div class="meta"><div><span>수집 시각</span><br>'+esc(new Date(c.capturedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}))+' KST<br><span>'+esc(c.capturedAt)+' / 미국 동부 날짜 '+esc(c.usDate)+'</span></div><div><span>검증 상태</span><br>'+esc(c.market)+'<br>'+esc(c.reviewed?'표시 문구 검토 완료':'자동 수집 · 혜택 해석 검토 대기')+'</div></div>'+offersFor(data).filter(a=>a.captureId===id).map(a=>'<p><span class="tag">'+(a.verified?'검토된 표시값':'자동 추출 · 조건 미검토')+'</span> <b>'+esc(a.brand)+' '+esc(a.value)+'</b><br>'+esc(a.evidence||a.summary)+'<br>'+esc(a.conditions)+'</p>').join('')+'<p><b>관측 메모</b><br>'+esc(c.note)+'</p>'+data.activities.filter(a=>a.captureId===id).map(a=>'<p><span class="tag">'+esc(types[a.type])+'</span> <b>'+esc(a.summary)+'</b><br>'+esc(a.conditions)+'</p>').join('')+'<p><a href="'+esc(c.url)+'" target="_blank" rel="noopener noreferrer">원문 페이지 ↗ '+esc(c.url)+'</a></p><p class="muted">표시된 스크린샷은 수집 시점의 화면입니다. 본문에서 확인한 일부 혜택은 캡처 영역 아래에 위치할 수 있습니다. 전체 지면의 광고 노출을 보장하지 않습니다.</p>';$('#detail').showModal();}
document.addEventListener('click',e=>{const el=e.target.closest('[data-id]');if(el)detail(el.dataset.id)});
$('#close').onclick=()=>$('#detail').close();$('#detail').addEventListener('click',e=>{if(e.target===$('#detail'))$('#detail').close()});
['search','status','kind'].forEach(id=>$('#'+id).addEventListener('input',gallery));['registrySearch','registryMode'].forEach(id=>$('#'+id).addEventListener('input',registryRender));
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('#export').onclick=()=>download('publisher-pulse-'+data.date+'.json',JSON.stringify(data,null,2),'application/json');
$('#csv').onclick=()=>{const cell=s=>'"'+String(/^[=+\-@]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';download('publisher-coverage-'+data.date+'.csv','\uFEFF'+[['원문명','정규화 이름','분류','메모'],...data.registry.map(r=>[r.name,r.canonical,modes[r.mode],r.note])].map(row=>row.map(cell).join(',')).join('\r\n'),'text/csv;charset=utf-8')};
async function load(date){
 const version=++loadVersion;
 const dates=allDates.filter(d=>d<=date).sort().slice(-14);
 const loaded=await Promise.all(dates.map(async d=>{const r=await fetch('./data/'+d+'.json');if(!r.ok)throw Error('관측 데이터 로드 실패');return r.json()}));
 if(version!==loadVersion)return;
 historyData=loaded;data=loaded.find(d=>d.date===date);previousData=loaded.filter(d=>d.date<date).at(-1)||null;
 for(const [id,values,label] of [['globalPublisher',[...new Set(data.captures.map(c=>c.publisher))].sort(),'전체 퍼블리셔'],['globalBrand',[...new Set([...data.captures.flatMap(c=>c.brands),...offersFor(data).map(a=>a.brand)])].sort(),'전체 브랜드'],['kind',[...new Set(data.captures.map(c=>c.kind))].sort(),'전체 채널']]){
 const el=$('#'+id),value=el.value;el.innerHTML='<option value="">'+label+'</option>'+values.map(v=>'<option>'+esc(v)+'</option>').join('');el.value=values.includes(value)?value:'';
 }
 render();
}
$('#date').onchange=()=>load($('#date').value).catch(e=>toast(e.message));
$('#compare').onclick=async()=>{const prev=allDates.filter(d=>d<data.date).sort().at(-1);if(!prev){toast('이전 관측이 없습니다. 데이터가 누적된 뒤 비교할 수 있습니다.');return}try{const r=await fetch('./data/'+prev+'.json');if(!r.ok)throw Error();const old=await r.json();const changes=filteredCaptures().map(c=>{const p=old.captures.find(x=>x.id===c.id);return {c,p,changed:!p||c.status!==p.status||c.sha256!==p.sha256}}).filter(x=>x.changed);$('#comparison').innerHTML='<p class="muted">'+prev+' 대비 본문 또는 상태 변화 '+changes.length+'건. 동적 콘텐츠 변화도 포함하며 광고 변화로 단정하지 않습니다.</p>'+changes.map(({c,p})=>'<div class="comparison-row">'+esc(c.publisher)+' · '+esc(p?'본문/상태 변화 감지':'새 지면')+' <button data-id="'+esc(c.id)+'" class="text-button">현재 캡처 ↗</button>'+(p?.screenshot?' <a href="./'+esc(p.screenshot)+'" target="_blank" rel="noopener noreferrer">이전 캡처 ↗</a>':'')+'</div>').join('')}catch{toast('이전 데이터를 불러오지 못했습니다.')}};
(async()=>{const res=await fetch('./data/index.json');if(!res.ok)throw Error('데이터 인덱스 로드 실패');allDates=(await res.json()).dates.sort().reverse();$('#date').innerHTML=allDates.map(d=>'<option>'+d+'</option>').join('');await load(allDates[0]);view(location.hash.slice(1));})().catch(e=>{$('#metrics').innerHTML='<p>데이터를 불러올 수 없습니다. 새로고침해 주세요.</p>';console.error(e)});

['globalPublisher','globalBrand'].forEach(id=>$('#'+id).addEventListener('change',render));
$('#resetFilters').onclick=()=>{$('#globalPublisher').value='';$('#globalBrand').value='';$('#search').value='';$('#status').value='';$('#kind').value='';render()};
document.addEventListener('click',async e=>{const el=e.target.closest('[data-history-date]');if(!el)return;try{$('#date').value=el.dataset.historyDate;await load(el.dataset.historyDate);detail(el.dataset.historyId)}catch(error){toast(error.message)}});

$('#trackerStatus').innerHTML='<option value="">전체 상태</option>'+Object.entries(trackerLabels).map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('');
initTracker();

initOfficial();
