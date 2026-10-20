(function(){
const $=id=>document.getElementById(id), L=localStorage;
const get=(k,d)=>{try{return JSON.parse(L.getItem(k))??d}catch(e){return d}}, set=(k,v)=>L.setItem(k,JSON.stringify(v));
let biz=get('tb_biz',{name:'',phone:'',addr:'',cur:'USD',taxn:'Sales tax',taxr:0,start:1001,pay:'',logo:''});
let docs=get('tb_docs',[]), pro=get('tb_pro',false), cur=null;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sym=()=>biz.cur==='GBP'?'£':'$', money=n=>sym()+(Math.round(n*100)/100).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10), ym=d=>d.slice(0,7);
function blank(type){const n=docs.length?Math.max(...docs.map(d=>+d.num||0),biz.start-1)+1:biz.start;
 const due=new Date();due.setDate(due.getDate()+14);
 return{id:'d'+Date.now(),type:type||'Invoice',num:String(n),date:today(),due:due.toISOString().slice(0,10),cname:'',caddr:'',items:[{d:'',q:1,r:0}],disc:0,dep:0,notes:'',status:'due',created:today()}}
function usedThisMonth(){return docs.filter(d=>ym(d.created)===ym(today())).length}
function canSave(){if(pro)return true;if(docs.some(d=>d.id===cur.id))return true;return usedThisMonth()<TB.FREE_DOCS_PER_MONTH}
function calc(d){const sub=d.items.reduce((s,i)=>s+(+i.q||0)*(+i.r||0),0), after=Math.max(0,sub-(+d.disc||0)), tax=after*(+biz.taxr||0)/100, tot=after+tax;return{sub,tax,tot,bal:tot-(+d.dep||0)}}
function drawItems(){$('items').innerHTML=cur.items.map((it,i)=>`<div class="item"><input data-i="${i}" data-f="d" placeholder="Description" value="${esc(it.d)}"><input data-i="${i}" data-f="q" type="number" min="0" step="any" value="${it.q}"><input data-i="${i}" data-f="r" type="number" min="0" step="0.01" value="${it.r}"><button class="x" data-x="${i}" aria-label="Remove">×</button></div>`).join('')}
function drawDoc(){const d=cur,c=calc(d),lbl=d.type==='Estimate';
 $('doc').innerHTML=`<div class="dhead"><div>${pro&&biz.logo?`<img src="${biz.logo}" alt="">`:''}<strong>${esc(biz.name)||'Your business name'}</strong><div class="small muted" style="white-space:pre-line">${esc(biz.addr)}${biz.phone?'\n'+esc(biz.phone):''}</div></div>
 <div class="right"><h2>${d.type}</h2><div class="muted">#${esc(d.num)}</div><div class="small">Date: ${esc(d.date)}${lbl?'':'<br>Due: '+esc(d.due)}</div></div></div>
 <div style="margin-top:18px"><div class="small muted">${lbl?'PREPARED FOR':'BILL TO'}</div><strong>${esc(d.cname)||'Client name'}</strong><div class="small muted" style="white-space:pre-line">${esc(d.caddr)}</div></div>
 <table><tr><th>Description</th><th class="n">Qty</th><th class="n">Rate</th><th class="n">Amount</th></tr>${d.items.filter(i=>i.d||i.r).map(i=>`<tr><td>${esc(i.d)}</td><td class="n">${+i.q||0}</td><td class="n">${money(+i.r||0)}</td><td class="n">${money((+i.q||0)*(+i.r||0))}</td></tr>`).join('')}</table>
 <div class="tot"><div><span>Subtotal</span><span>${money(c.sub)}</span></div>${+d.disc?`<div><span>Discount</span><span>-${money(+d.disc)}</span></div>`:''}${+biz.taxr?`<div><span>${esc(biz.taxn)} (${+biz.taxr}%)</span><span>${money(c.tax)}</span></div>`:''}<div><span>Total</span><span>${money(c.tot)}</span></div>${+d.dep?`<div><span>Deposit paid</span><span>-${money(+d.dep)}</span></div>`:''}<div class="g"><span>${lbl?'Estimate total':'Balance due'}</span><span>${money(lbl?c.tot:c.bal)}</span></div></div>
 ${d.notes?`<p class="small" style="white-space:pre-line;margin-top:22px">${esc(d.notes)}</p>`:''}${biz.pay&&!lbl?`<div style="margin-top:14px"><div class="small muted">HOW TO PAY</div><div class="small" style="white-space:pre-line">${esc(biz.pay)}</div></div>`:''}
 ${pro?'':'<div class="wm">Made with TradeBill - free invoice maker for trades</div>'}`}
function quota(){const q=$('quota');if(pro){q.className='banner';q.textContent='Pro: unlimited documents.';}else{const left=Math.max(0,TB.FREE_DOCS_PER_MONTH-usedThisMonth());q.className='banner'+(left?'':' warn');q.textContent=left?`Free plan: ${left} of ${TB.FREE_DOCS_PER_MONTH} documents left this month.`:'You used all free documents this month. Go Pro for unlimited.'}
 $('plan').textContent=pro?'Pro':'Free';$('plan').className='tag'+(pro?' paid':'');$('upg').style.display=pro?'none':''}
function load(d){cur=JSON.parse(JSON.stringify(d));['type','num','date','due','cname','caddr','disc','dep','notes'].forEach(k=>$(k).value=cur[k]);drawItems();drawDoc();quota();tab('edit')}
function read(){['type','num','date','due','cname','caddr','disc','dep','notes'].forEach(k=>cur[k]=$(k).value)}
function clients(){$('clients').innerHTML=pro?[...new Set(docs.map(d=>d.cname).filter(Boolean))].map(n=>`<option value="${esc(n)}">`).join(''):''}
function save(){read();if(!canSave()){modal();return false}const i=docs.findIndex(d=>d.id===cur.id);if(i>=0)docs[i]=JSON.parse(JSON.stringify(cur));else docs.unshift(JSON.parse(JSON.stringify(cur)));set('tb_docs',docs);quota();clients();drawHist();return true}
function drawHist(){$('hist').innerHTML='<tr><th>#</th><th>Type</th><th>Client</th><th>Total</th><th>Status</th><th></th></tr>'+(docs.length?docs.map(d=>`<tr><td>${esc(d.num)}</td><td>${d.type}</td><td>${esc(d.cname)}</td><td>${money(calc(d).tot)}</td><td><span class="tag ${d.status}">${d.status==='paid'?'Paid':'Open'}</span></td><td><button class="btn alt sm" data-o="${d.id}">Open</button> <button class="btn alt sm" data-p="${d.id}">${d.status==='paid'?'Unpay':'Paid'}</button> <button class="btn danger sm" data-d="${d.id}">Delete</button></td></tr>`).join(''):'<tr><td colspan="6" class="muted">No saved documents yet.</td></tr>')}
function tab(t){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));['edit','hist','biz'].forEach(x=>$('v-'+x).style.display=x===t?'':'none');if(t==='edit')$('v-edit').style.display='grid';if(t==='hist')drawHist()}
function modal(){$('mp').textContent=TB.price;$('m').classList.add('on');if(TB.CHECKOUT_URL){$('buy').href=TB.CHECKOUT_URL;$('buy').style.display='';$('soon').style.display='none'}else{$('buy').style.display='none';$('soon').style.display=''}}
async function validate(key){try{const r=await fetch('https://api.lemonsqueezy.com/v1/licenses/validate',{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/x-www-form-urlencoded'},body:'license_key='+encodeURIComponent(key)});const j=await r.json();
 if(!j.valid)return{ok:false,msg:j.error||'That key is not valid.'};
 if(TB.LS_STORE_ID&&j.meta&&+j.meta.store_id!==+TB.LS_STORE_ID)return{ok:false,msg:'That key is not for TradeBill.'};
 if(j.license_key&&['expired','disabled'].includes(j.license_key.status))return{ok:false,msg:'This license is '+j.license_key.status+'.'};return{ok:true}}catch(e){return{ok:null,msg:'Could not reach the license server. Check your internet.'}}}
function bindBiz(){const m={bname:'name',bphone:'phone',baddr:'addr',cur:'cur',taxn:'taxn',taxr:'taxr',start:'start',pay:'pay'};Object.entries(m).forEach(([i,k])=>$(i).value=biz[k]??'')}
document.addEventListener('input',e=>{if(!cur)return;const t=e.target;if(t.dataset.f){cur.items[+t.dataset.i][t.dataset.f]=t.value;drawDoc()}else if(['type','num','date','due','cname','caddr','disc','dep','notes'].includes(t.id)){read();drawDoc()}});
document.addEventListener('click',e=>{const t=e.target;
 if(t.dataset.x!==undefined){cur.items.splice(+t.dataset.x,1);if(!cur.items.length)cur.items=[{d:'',q:1,r:0}];drawItems();drawDoc()}
 if(t.dataset.o){load(docs.find(d=>d.id===t.dataset.o))}
 if(t.dataset.p){const d=docs.find(d=>d.id===t.dataset.p);d.status=d.status==='paid'?'due':'paid';set('tb_docs',docs);drawHist()}
 if(t.dataset.d&&confirm('Delete this document?')){docs=docs.filter(d=>d.id!==t.dataset.d);set('tb_docs',docs);quota();drawHist()}
 if(t.dataset.t)tab(t.dataset.t)});
$('addi').onclick=()=>{cur.items.push({d:'',q:1,r:0});drawItems()};
$('save').onclick=()=>{if(save())alert('Saved.')};
$('pdf').onclick=()=>{if(save())window.print()};
$('new').onclick=()=>load(blank($('type').value));
$('upg').onclick=modal;$('mc').onclick=()=>$('m').classList.remove('on');
$('act').onclick=async()=>{const k=$('key').value.trim();if(!k)return;$('kmsg').textContent='Checking...';const r=await validate(k);if(r.ok){pro=true;set('tb_pro',true);set('tb_key',k);$('kmsg').textContent='Pro unlocked. Thank you!';quota();drawDoc();clients();setTimeout(()=>$('m').classList.remove('on'),900)}else $('kmsg').textContent=r.msg};
$('bsave').onclick=()=>{biz.name=$('bname').value;biz.phone=$('bphone').value;biz.addr=$('baddr').value;biz.cur=$('cur').value;biz.taxn=$('taxn').value;biz.taxr=+$('taxr').value||0;biz.start=+$('start').value||1001;biz.pay=$('pay').value;set('tb_biz',biz);drawDoc();alert('Saved.');tab('edit')};
$('logo').onchange=e=>{if(!pro){modal();e.target.value='';return}const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,400/im.width),c=document.createElement('canvas');c.width=im.width*s;c.height=im.height*s;c.getContext('2d').drawImage(im,0,0,c.width,c.height);biz.logo=c.toDataURL('image/png');set('tb_biz',biz);drawDoc()};im.src=r.result};r.readAsDataURL(f)};
$('csv').onclick=()=>{if(!pro){modal();return}const rows=[['Number','Type','Date','Client','Total','Status']].concat(docs.map(d=>[d.num,d.type,d.date,d.cname,calc(d).tot.toFixed(2),d.status]));const b=new Blob([rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='tradebill.csv';a.click()};
bindBiz();load(blank());clients();
if(pro&&get('tb_key',''))validate(get('tb_key','')).then(r=>{if(r.ok===false){pro=false;set('tb_pro',false);quota();drawDoc()}});
if(location.search.includes('upgrade'))modal();
})();
