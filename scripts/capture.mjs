import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
const ROOT = new URL('../', import.meta.url);
const pathOf = p => new URL(p, ROOT);
const read = async p => JSON.parse(await fs.readFile(pathOf(p), 'utf8'));
const dateKey = (date,tz) => new Intl.DateTimeFormat('en-CA',{timeZone:tz}).format(date);
const now = new Date(), date = dateKey(now,'Asia/Seoul'), runId = now.toISOString().replace(/[:.]/g,'-');
const index = await read('dist/data/index.json');
if (index.dates.includes(date)) {
  console.log('An immutable snapshot already exists for '+date+'. Keeping it unchanged.');
  process.exit(0);
}
const previous = await read('dist/data/'+[...index.dates].sort().at(-1)+'.json');
const targets = (await read('targets.json')).filter(t=>t.enabled);
const proxy = process.env.US_PROXY_SERVER ? {server:process.env.US_PROXY_SERVER,username:process.env.US_PROXY_USERNAME,password:process.env.US_PROXY_PASSWORD} : undefined;
const browser = await chromium.launch({headless:true,proxy});
const context = await browser.newContext({viewport:{width:1440,height:1000},locale:'en-US',timezoneId:'America/New_York',colorScheme:'light'});
let country = null;
try {
 const geo = await context.request.get('https://ipapi.co/json/',{timeout:15000});
 if(geo.ok())country=(await geo.json()).country_code||null;
} catch { console.log('Country verification unavailable; snapshots remain unverified.'); }
const folder='captures/'+date+'/'+runId;
await fs.mkdir(pathOf('dist/'+folder),{recursive:true});
const captures=[], exclusions=new Set(['www.retailmenot.com','retailmenot.com','www.cnet.com','cnet.com']);
const brandNames=['Samsung','LG','GE Appliances','Whirlpool','Dyson','Bosch','Hisense','TCL','Sony','Shark','Frigidaire','KitchenAid','Miele','Beko'];
for(const target of targets){
 if(exclusions.has(new URL(target.url).hostname))continue;
 const page=await context.newPage();
 let r={id:target.id,publisher:target.publisher,kind:target.kind,url:target.url,date,usDate:dateKey(new Date(),'America/New_York'),capturedAt:new Date().toISOString(),status:'error',screenshot:null,brands:[],usIpVerified:country==='US',country,market:country==='US'?'US IP 확인 · 비로그인':country?'접속국 '+country+' · US IP 아님':'US 대상 · IP 미검증',reviewed:false,note:'자동 수집: 혜택 값과 광고 여부는 검토 대기.',scope:'1440×1000 desktop viewport'};
 try {
  const response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForLoadState('load',{timeout:12000}).catch(()=>{});
  await page.locator('body').waitFor({state:'visible',timeout:10000});
  const body=await page.locator('body').innerText({timeout:10000});
  r.title=await page.title();r.url=page.url();r.httpStatus=response?.status()??null;
  r.status=/just a moment|verify you are human|checking your browser|보안 확인|access denied|captcha/i.test(r.title+' '+body.slice(0,1800))?'challenge':
   (r.httpStatus===404||/page not found/i.test(r.title))?'not_found':
   r.httpStatus>=400?'error':body.trim().length<100?'render_failed':target.access==='entry_only'?'entry_only':'captured';
  r.brands=r.status==='captured'?brandNames.filter(b=>new RegExp('\\b'+b+'\\b','i').test(body)):[];
  r.sha256=crypto.createHash('sha256').update(body.replace(/\s+/g,' ').trim()).digest('hex');
  const shot=folder+'/'+target.id+'.jpg';
  await page.screenshot({path:pathOf('dist/'+shot).pathname.replace(/^\/([A-Za-z]:)/,'$1'),type:'jpeg',quality:80,fullPage:false,timeout:15000});
  r.screenshot=shot;
  r.note=r.status==='captured'?'공개 화면 자동 캡처. 브랜드 언급은 탐지 후보이며 프로모션 조건·유료 광고 여부는 미검토.':r.status==='entry_only'?'공개 입구만 확인. 회원 전용 혜택은 수집하지 않았습니다.':'접속 또는 표시 문제. 정상 경쟁사 지면으로 계산하지 않습니다.';
 } catch(error) {r.note='수집 실패: '+String(error.message).slice(0,180);r.title=target.publisher+' 수집 실패';}
 captures.push(r);console.log(target.publisher+': '+r.status);
 await page.close();await new Promise(resolve=>setTimeout(resolve,1500));
}
await browser.close();
const registry=previous.registry.map(r=>({...r,captureIds:r.mode==='registered'?captures.filter(c=>c.publisher===r.canonical).map(c=>c.id):[]}));
const data={...previous,date,generatedAt:new Date().toISOString(),collection:{...previous.collection,method:'Playwright 자동 일별 수집',country,usIpVerified:country==='US',viewport:'1440 × 1000',scheduleState:'active'},captures,activities:[],registry};
if(!captures.length)throw Error('No target processed; preserve existing dataset');
await fs.writeFile(pathOf('dist/data/'+date+'.json'),JSON.stringify(data,null,2));
await fs.writeFile(pathOf('dist/data/index.json'),JSON.stringify({dates:[...index.dates,date].sort()}));
console.log('Saved '+captures.length+' outcomes; '+captures.filter(c=>c.status==='captured').length+' public pages. Country: '+(country||'unknown'));
