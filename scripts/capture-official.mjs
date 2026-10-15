import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
import {promoLines} from '../dist/official-core.js';
const key=(t,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz}).format(t);
const now=new Date(),date=key(now,'Asia/Seoul'),run=now.toISOString().replace(/[:.]/g,'-');
const dir='dist/data/official';await fs.mkdir(dir,{recursive:true});
let index={dates:[]};try{index=JSON.parse(await fs.readFile(dir+'/index.json','utf8'))}catch{}
if(index.dates.includes(date)){console.log('Official snapshot exists: '+date);process.exit(0)}
const targets=[
 {id:'lg-promotions',brand:'LG',label:'LG 전체 프로모션',url:'https://www.lg.com/us/promotions'},
 {id:'lg-home',brand:'LG',label:'LG US 메인',url:'https://www.lg.com/us'},
 {id:'samsung-appliances',brand:'Samsung',label:'Samsung 가전 오퍼',url:'https://www.samsung.com/us/shop/home-appliance-and-smart-home-offers/'},
 {id:'samsung-promotions',brand:'Samsung',label:'Samsung 리베이트·신청형 혜택',url:'https://www.samsung.com/us/promotions/'}
];
const proxy=process.env.US_PROXY_SERVER?{server:process.env.US_PROXY_SERVER,username:process.env.US_PROXY_USERNAME,password:process.env.US_PROXY_PASSWORD}:undefined;
const browser=await chromium.launch({headless:true,proxy});
const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-US',timezoneId:'America/New_York'});
let country=null;try{const r=await context.request.get('https://ipapi.co/json/',{timeout:15000});if(r.ok())country=(await r.json()).country_code||null}catch{}
const folder='captures/official/'+date+'/'+run;await fs.mkdir('dist/'+folder,{recursive:true});
const pages=[];
try{
 for(const target of targets){
 const page=await context.newPage(),record={...target,date,usDate:key(new Date(),'America/New_York'),capturedAt:new Date().toISOString(),country,usIpVerified:country==='US',status:'error',promotions:[],screenshot:null,reviewed:false};
 try{
 const r=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForLoadState('load',{timeout:10000}).catch(()=>{});
 await page.locator('body').waitFor({state:'visible',timeout:10000});
 let body=await page.locator('body').innerText({timeout:10000});
 if(body.length<200){await page.waitForFunction(()=>document.body?.innerText.length>200,{},{timeout:8000}).catch(()=>{});body=await page.locator('body').innerText()}
 record.url=page.url();record.title=await page.title();record.httpStatus=r?.status()||0;
 const host=new URL(record.url).hostname;
 const valid=(record.brand==='LG'?/(^|\.)lg\.com$/:/(^|\.)samsung\.com$/).test(host)&&new URL(record.url).pathname.startsWith('/us');
 record.status=!valid?'wrong_market':/access denied|just a moment|verify you are human|captcha|pardon our interruption/i.test(record.title+' '+body.slice(0,1600))?'challenge':record.httpStatus>=400?'error':body.trim().length<200?'render_failed':'captured';
 record.sha256=crypto.createHash('sha256').update(body.replace(/\s+/g,' ').trim()).digest('hex');
 if(record.status==='captured')record.promotions=promoLines(body);
 const shot=folder+'/'+target.id+'.jpg';await page.screenshot({path:'dist/'+shot,type:'jpeg',quality:80,fullPage:true,timeout:20000});record.screenshot=shot;
 }catch(e){record.status='error';record.promotions=[];record.error=String(e.message).slice(0,200)}
 finally{await page.close()}
 pages.push(record);console.log(record.id+': '+record.status+' / '+record.promotions.length+' candidates');
 }
}finally{await browser.close()}
await fs.writeFile(dir+'/'+date+'.json',JSON.stringify({date,generatedAt:new Date().toISOString(),pages},null,2));
await fs.writeFile(dir+'/index.json',JSON.stringify({dates:[...index.dates,date].sort()}));
