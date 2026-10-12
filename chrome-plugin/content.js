(()=>{
if(window.__careerJournal)return;window.__careerJournal=true;
const SUCCESS=/投递成功|申请成功|网申成功|简历提交成功|application (?:has been )?submitted|successfully applied/i;
function extract(){
 let job=null;for(const el of document.querySelectorAll('script[type="application/ld+json"]')){try{const data=JSON.parse(el.textContent);const nodes=Array.isArray(data)?data:[data,...(data['@graph']||[])];job=nodes.find(x=>x['@type']==='JobPosting');if(job)break}catch{}}
 const clean=html=>{const d=document.createElement('div');d.innerHTML=String(html||'');return d.textContent.trim()};
 const main=document.querySelector('main,[role="main"],article')||document.body;
 return {company:job?.hiringOrganization?.name||document.querySelector('meta[property="og:site_name"]')?.content||location.hostname,role:job?.title||document.querySelector('h1')?.innerText||document.title,jd:job?.description?clean(job.description):main.innerText.slice(0,50000),url:location.href.split('#')[0],status:'待确认',source:'浏览器插件',applied_at:new Date().toISOString()};
}
let pending=null;try{pending=JSON.parse(sessionStorage.getItem('__career_pending')||'null')}catch{}
function toast(text){let el=document.querySelector('#career-journal-toast');if(!el){el=document.createElement('div');el.id='career-journal-toast';el.style.cssText='position:fixed;bottom:24px;right:24px;z-index:2147483647;background:#245b42;color:white;padding:16px;border-radius:10px;font:14px system-ui;max-width:300px';document.documentElement.append(el)}el.textContent=text;setTimeout(()=>el.remove(),5000)}
function save(record){chrome.runtime.sendMessage({type:'save',record,automatic:true},r=>{if(chrome.runtime.lastError)return;toast(r?.ok?'投递记录已保存：'+record.status:'保存失败：'+(r?.error||'请检查插件'))})}
function start(){const text=document.body.innerText;if(!/岗位职责|职位描述|任职要求|任职资格|job description|responsibilities/i.test(text))return;pending={record:extract(),time:Date.now(),baselineSuccess:SUCCESS.test(text)};sessionStorage.setItem('__career_pending',JSON.stringify(pending));save(pending.record)}
const onClick=e=>{const b=e.target.closest('button,a,[role="button"],input[type="submit"]');if(b&&/^(立即投递|投递简历|提交申请|确认投递|申请职位|立即申请|提交简历|apply now|submit application)$/i.test((b.innerText||b.value||'').trim()))start()};
let timer;const check=()=>{if(!pending||Date.now()-pending.time>10*60*1000)return;const text=document.body.innerText;if(!pending.baselineSuccess&&SUCCESS.test(text)){const r={...pending.record,status:'已投递'};pending=null;sessionStorage.removeItem('__career_pending');save(r)}};
const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(check,400)});let monitoring=false;
function setMonitoring(enabled){if(enabled===monitoring)return;monitoring=enabled;if(enabled){document.addEventListener('click',onClick,true);observer.observe(document.body,{subtree:true,childList:true,characterData:true});check()}else{document.removeEventListener('click',onClick,true);observer.disconnect();clearTimeout(timer);pending=null;sessionStorage.removeItem('__career_pending')}}
chrome.storage.local.get('enabledOrigins').then(r=>setMonitoring(Boolean(r.enabledOrigins?.[location.origin])));
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.enabledOrigins)setMonitoring(Boolean(changes.enabledOrigins.newValue?.[location.origin]))});
chrome.runtime.onMessage.addListener((m,sender,reply)=>{if(m.type==='extract')reply(extract())});
})();
