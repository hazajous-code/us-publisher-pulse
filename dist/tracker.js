import {parseTSV,reconcile,labels} from './tracker-core.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let source=[],snapshots=[],results=[],generation=0;
export function initTracker(){
 const render=()=>{
 results=reconcile(source,snapshots,{basis:$('#trackerBasis').value,brand:$('#trackerBrand').value,year:Number($('#trackerYear').value)});
 const query=$('#trackerSearch').value.toLowerCase(),status=$('#trackerStatus').value;
 const shown=results.filter(r=>(!status||r.status===status)&&(!query||[r.publisher,r.placement,r.category,r.cid].join(' ').toLowerCase().includes(query)));
 $('#trackerSummary').innerHTML=[['표의 집행 항목',results.length],['브랜드·기간 후보',results.filter(r=>r.status==='candidate').length],['별도 증빙 필요',results.filter(r=>r.status==='private').length],['집행 확정',0]].map(([l,n])=>'<div class="metric"><div class="label">'+l+'</div><div class="value">'+n+'<span>건</span></div></div>').join('');
 $('#trackerCount').textContent=shown.length+' / '+results.length+'행 · 보관된 '+snapshots.length+'개 관측일 전체 대조';
 $('#trackerRows').innerHTML=shown.map(r=>'<tr><td>'+r.row+'<small>CID '+esc(r.cid||'없음')+'</small></td><td>'+esc(r.publisher)+'<small>'+esc(r.canonical)+' · 이름 기반 연결</small></td><td>'+esc(r.startDate||r.start)+'<br>~ '+esc(r.endDate||r.end)+(r.warning?'<small class="tracker-warning">'+esc(r.warning)+'</small>':'')+'</td><td>'+esc(r.placement)+'<small>'+esc(r.store)+' / '+esc(r.category)+'</small></td><td><span class="tag '+(r.status==='candidate'?'':'pending')+'">'+labels[r.status]+'</span><small>'+esc(r.reason)+'</small></td><td>'+r.captures.slice(0,6).map(c=>'<button class="text-button" data-history-date="'+esc(c.snapshotDate)+'" data-history-id="'+esc(c.id)+'">'+esc(c.observedDate)+' · '+esc(c.status==='captured'?'공개 화면':c.status)+' ↗</button>').join('<br>')+(r.captures.length>6?'<small>총 '+r.captures.length+'개 기록 · CSV에 전체 근거 포함</small>':'')+(!r.captures.length?'<small>'+r.allPublisherCaptures+'개 퍼블리셔 기록 / 기간 내 0개</small>':'')+'</td></tr>').join('');
 $('#trackerDownload').disabled=!results.length;
 };
 async function ingest(text){
 const request=++generation;
 try{
 const parsed=parseTSV(text);
 if(!parsed.length)throw Error('대조할 행이 없습니다.');
 $('#trackerMessage').textContent='공개 캡처 기록을 불러오는 중입니다…';
 const indexResponse=await fetch('./data/index.json');if(!indexResponse.ok)throw Error('관측 목록을 불러오지 못했습니다.');
 const index=await indexResponse.json();
 const loaded=await Promise.all(index.dates.map(async date=>{const r=await fetch('./data/'+date+'.json');if(!r.ok)throw Error(date+' 기록을 불러오지 못했습니다.');return r.json()}));
 if(request!==generation)return;
 source=parsed;snapshots=loaded;$('#trackerPaste').value='';
 $('#trackerMessage').textContent=source.length+'행을 읽었습니다. 파일·표 내용은 서버 전송 및 브라우저 저장 없이 현재 탭 메모리에서만 처리합니다.';
 render();
 }catch(e){if(request===generation)$('#trackerMessage').textContent=e.message}
 }
 $('#trackerFile').onchange=async e=>{const f=e.target.files[0];if(f){if(f.size>5_000_000){$('#trackerMessage').textContent='5MB 이하의 탭 구분 텍스트를 사용하세요.';return}await ingest(await f.text());e.target.value=''}};
 $('#trackerRead').onclick=()=>ingest($('#trackerPaste').value);
 ['trackerBasis','trackerBrand','trackerYear','trackerStatus','trackerSearch'].forEach(id=>$('#'+id).addEventListener('input',render));
 $('#trackerClear').onclick=()=>{generation++;source=[];snapshots=[];results=[];$('#trackerPaste').value='';$('#trackerFile').value='';$('#trackerMessage').textContent='입력한 표를 현재 탭에서 지웠습니다.';render()};
 $('#trackerDownload').onclick=()=>{
 const cell=s=>'"'+String(/^[=+\-@\t\r]/.test(String(s))?"'"+s:s).replaceAll('"','""')+'"';
 const rows=[['원본 행','CID','퍼블리셔','시작일','종료일','예정 지면','판정','사유','경고','캡처 근거'],...results.map(r=>[r.row,r.cid,r.publisher,r.startDate||r.start,r.endDate||r.end,r.placement,labels[r.status],r.reason,r.warning,r.captures.map(c=>c.screenshot?new URL('./'+c.screenshot,location.href).href:c.status).join(' | ')])];
 const url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='tracker-match.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 render();
}
