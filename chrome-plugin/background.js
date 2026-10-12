const fields=['applied_at','company','role','jd','status','url','source'];
function normalize(input){if(!input||typeof input!=='object')throw Error('记录格式错误');const r={};for(const f of fields)r[f]=String(input[f]??'').slice(0,60000);if(!r.company.trim()||!r.role.trim())throw Error('公司和岗位不能为空');if(r.url&&!/^https?:\/\//.test(r.url))throw Error('岗位链接必须是 HTTP 或 HTTPS');r.status=r.status||'待确认';r.applied_at=r.applied_at||new Date().toISOString();r.source=r.source||'手动';r.updated_at=new Date().toISOString();return r}
function key(r){return JSON.stringify([r.applied_at,r.company,r.role,r.jd,r.status,r.url])}
let chain=Promise.resolve();
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(!['list','save','update','import'].includes(m.type))return;
 const own=sender.url?.startsWith(chrome.runtime.getURL(''));
 if(!own&&(m.type!=='save'||!m.automatic)){reply({ok:false,error:'只允许记录页面执行此操作'});return}
 chain=chain.catch(()=>{}).then(async()=>{try{
  const {records=[]}=await chrome.storage.local.get('records');
  if(m.type==='list'){reply({ok:true,records:records.slice().sort((a,b)=>b.applied_at.localeCompare(a.applied_at)||b.id-a.id)});return}
  let next=Math.max(0,...records.map(r=>r.id))+1;
  if(m.type==='import'){
   if(!Array.isArray(m.records)||m.records.length>10000)throw Error('一次最多导入 10000 条');
   const incoming=m.records.map(normalize),keys=new Set(records.map(key));let added=0,skipped=0;
   for(const r of incoming){if(keys.has(key(r))){skipped++;continue}r.id=next++;records.push(r);keys.add(key(r));added++}
   await chrome.storage.local.set({records});reply({ok:true,added,skipped});return;
  }
  const r=normalize(m.record);let index=-1;
  if(m.type==='update'){index=records.findIndex(v=>v.id===m.id);if(index<0)throw Error('记录不存在')}
  else if(r.source==='浏览器插件'&&r.url){index=records.findIndex(v=>v.url===r.url&&v.company===r.company&&v.role===r.role&&v.source===r.source);if(index>=0){r.applied_at=records[index].applied_at;if(m.automatic&&records[index].status!=='待确认')r.status=records[index].status}}
  if(index>=0){r.id=records[index].id;records[index]=r}else{r.id=next;records.push(r)}
  await chrome.storage.local.set({records});reply({ok:true,id:r.id});
 }catch(e){reply({ok:false,error:e.message})}});return true;
});
chrome.runtime.onInstalled.addListener(()=>chrome.action.setBadgeBackgroundColor({color:'#245b42'}));
