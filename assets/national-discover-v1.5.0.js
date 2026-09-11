(()=>{
'use strict';
const Ranker=window.SukuuSearchRanker;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-GH'):String(n??'—');
const title=s=>String(s??'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const norm=s=>Ranker?.normalize?Ranker.normalize(s):String(s??'').toLowerCase().trim();
const unique=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
const debounce=(fn,ms=120)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
const defaults={q:'',type:'all',region:'all',source:'all',contact:'all',sort:'relevance',page:1,view:'grid'};
const params=()=>new URLSearchParams(location.search);

function readState(){
  const p=params(),state={};
  for(const [k,d] of Object.entries(defaults)){
    const raw=p.get(k);
    state[k]=raw===null?d:(typeof d==='number'?(Number(raw)||d):raw);
  }
  return state;
}
function writeUrl(state,mode='replace'){
  const p=new URLSearchParams();
  for(const [k,v] of Object.entries(state)){
    const d=defaults[k];
    if(v===undefined||v===null||v===''||v==='all'||v===d||(k==='page'&&Number(v)===1))continue;
    p.set(k,String(v));
  }
  const next=location.pathname+(p.toString()?`?${p}`:'')+location.hash;
  const current=location.pathname+location.search+location.hash;
  if(next!==current)history[mode==='push'?'pushState':'replaceState'](null,'',next);
}
function toast(msg){
  let el=$('.toast');
  if(!el){el=document.createElement('div');el.className='toast';document.body.append(el)}
  el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1600);
}
function shellInit(){
  const root=document.documentElement,saved=localStorage.getItem('sukuu-theme');
  if(saved)root.dataset.theme=saved;
  $('.theme-button')?.addEventListener('click',()=>{
    root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';
    localStorage.setItem('sukuu-theme',root.dataset.theme);
    toast(root.dataset.theme==='dark'?'Dark mode':'Light mode');
  });
  $$('[data-nav="discover"]').forEach(a=>a.setAttribute('aria-current','page'));
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#q')?.focus()}});
  if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});
    $$('.reveal').forEach(x=>io.observe(x));
  }else $$('.reveal').forEach(x=>x.classList.add('in'));
}
function panelInit(onReset){
  const panel=$('#filterPanel'),scrim=$('#scrim');if(!panel)return;
  const open=()=>{panel.classList.add('open');scrim?.classList.add('open');document.body.style.overflow='hidden'};
  const close=()=>{panel.classList.remove('open');scrim?.classList.remove('open');document.body.style.overflow=''};
  $('#filterOpen')?.addEventListener('click',open);$('#filterClose')?.addEventListener('click',close);$('#filterApply')?.addEventListener('click',close);
  $('#filterReset')?.addEventListener('click',()=>{onReset();close()});scrim?.addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}
function setOptions(sel,values,label){
  if(!sel)return;const keep=sel.value;
  sel.innerHTML=`<option value="all">${esc(label)}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if([...sel.options].some(o=>o.value===keep))sel.value=keep;
}
function paginate(total,page,size){const pages=Math.max(1,Math.ceil(total/size));page=Math.min(Math.max(1,Number(page)||1),pages);const start=(page-1)*size;return{page,pages,start,end:Math.min(total,start+size)}}
function renderPager(el,total,page,size,onPage){
  const p=paginate(total,page,size);if(p.pages<=1){el.innerHTML='';return}
  const nums=[];for(let i=Math.max(1,p.page-2);i<=Math.min(p.pages,p.page+2);i++)nums.push(i);
  el.innerHTML=`<button ${p.page===1?'disabled':''} data-p="${p.page-1}" aria-label="Previous page">‹</button>${p.page>3?'<button data-p="1">1</button><span>…</span>':''}${nums.map(n=>`<button class="${n===p.page?'active':''}" data-p="${n}">${n}</button>`).join('')}${p.page<p.pages-2?`<span>…</span><button data-p="${p.pages}">${p.pages}</button>`:''}<button ${p.page===p.pages?'disabled':''} data-p="${p.page+1}" aria-label="Next page">›</button>`;
  $$('button[data-p]',el).forEach(b=>b.onclick=()=>onPage(Number(b.dataset.p)));
}
function applyView(results,buttons,state){results.classList.toggle('list',state.view==='list');buttons.forEach(b=>{const on=b.dataset.view===state.view;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))})}
function activeChips(el,state,onClear){
  const defs=[['type','Type',typeLabel],['region','Region'],['source','Source'],['contact','Contact',title]];
  el.innerHTML=defs.filter(([k])=>state[k]&&state[k]!=='all').map(([k,l,f])=>`<span class="chip">${l}: ${esc(f?f(state[k]):state[k])} <button data-clear="${k}" aria-label="Clear ${l}">×</button></span>`).join('');
  $$('[data-clear]',el).forEach(b=>b.onclick=()=>onClear(b.dataset.clear));
}
function typeLabel(t){return({school:'Schools',tertiary_institution:'Tertiary',tvet_provider:'TVET',programme:'Programmes'}[t]||title(t))}
function iconFor(t){return({school:'🏫',tertiary_institution:'🎓',tvet_provider:'🛠️',programme:'📘'}[t]||'◆')}
function loading(el,n=8){el.innerHTML=`<div class="loading-grid">${Array.from({length:n},()=>'<div class="skeleton"></div>').join('')}</div>`}
async function fetchFirstJson(urls){let last;for(const url of urls){try{const r=await fetch(url,{cache:'force-cache'});if(r.ok)return await r.json();last=new Error(`${r.status} ${url}`)}catch(e){last=e}}throw last||new Error('Data unavailable')}

let contactMaps=null;
async function loadContacts(){
  if(contactMaps)return contactMaps;
  try{
    const r=await fetch('/data/contacts/contact-enrichment.json',{cache:'force-cache'}),j=r.ok?await r.json():{records:[]};
    const maps={tertiary_institution:new Map(),tvet_provider:new Map()};
    for(const c of j.records||[])for(const n of c.match_names||[]){const k=norm(n);if(k&&!maps[c.entity_type]?.has(k))maps[c.entity_type].set(k,c)}
    contactMaps=maps;return maps;
  }catch{return{tertiary_institution:new Map(),tvet_provider:new Map()}}
}
function contactFor(maps,type,name){return maps?.[type]?.get(norm(name))||null}
function scopeOf(c){return c?.contact_scope==='entity_direct'?'direct':c?.contact_scope==='central_admissions_support'?'support':'none'}
function hasAny(c){return!!(c&&(c.phones?.length||c.emails?.length||c.website||c.apply_url||c.address||c.whatsapp?.length))}
function contactHas(c,kind){
  if(kind==='all')return true;const scope=scopeOf(c);if(scope!=='direct')return false;
  if(kind==='direct'||kind==='any')return hasAny(c);if(kind==='phone')return!!c.phones?.length;if(kind==='email')return!!c.emails?.length;if(kind==='website')return!!c.website;if(kind==='admissions')return!!c.apply_url;if(kind==='directions')return!!c.address;return false;
}
function contactActions(c){
  if(scopeOf(c)!=='direct')return'';const items=[],phone=c.phones?.[0],email=c.emails?.[0];
  if(phone)items.push(`<a class="action call" href="tel:${esc(phone.tel||phone.display||phone)}">☎ <span>Call</span></a>`);
  if(email)items.push(`<a class="action email" href="mailto:${esc(email)}">✉ <span>Email</span></a>`);
  if(c.website)items.push(`<a class="action website" href="${esc(c.website)}" target="_blank" rel="noreferrer">◎ <span>Website</span></a>`);
  return items.length?`<div class="contact-actions compact">${items.slice(0,3).join('')}</div>`:'';
}
function observedAt(c){return(c?.sources||[]).map(s=>s.observed_at||'').filter(Boolean).sort().at(-1)||''}
function stableSort(arr,state,prepared){
  if(state.sort==='relevance'&&prepared.tokens.length)return arr.sort((a,b)=>Ranker.compare(a,b,prepared));
  if(state.sort==='za')return arr.sort((a,b)=>b.name.localeCompare(a.name));
  if(state.sort==='type')return arr.sort((a,b)=>typeLabel(a.type).localeCompare(typeLabel(b.type))||a.name.localeCompare(b.name));
  if(state.sort==='region')return arr.sort((a,b)=>(a.region||'ZZZ').localeCompare(b.region||'ZZZ')||a.name.localeCompare(b.name));
  if(state.sort==='verified')return arr.sort((a,b)=>observedAt(b._contact).localeCompare(observedAt(a._contact))||a.name.localeCompare(b.name));
  return arr.sort((a,b)=>a.name.localeCompare(b.name));
}

async function init(){
  shellInit();
  if(!Ranker){console.error('Sukuu Search ranker unavailable');return}
  const state=readState(),q=$('#q'),results=$('#results'),count=$('#resultCount'),pager=$('#pagination'),sort=$('#sort'),region=$('#regionFilter'),source=$('#sourceFilter'),type=$('#typeFilter'),contact=$('#contactFilter'),viewBtns=$$('[data-view]');
  q.value=state.q;loading(results);let records=[];
  function sync(){q.value=state.q;type.value=state.type;region.value=state.region;source.value=state.source;contact.value=state.contact;sort.value=state.sort;$$('[data-type-card]').forEach(b=>b.classList.toggle('active',b.dataset.typeCard===state.type));applyView(results,viewBtns,state)}
  function render(){
    const prepared=Ranker.expandQuery(state.q);
    let arr=records.filter(r=>(state.type==='all'||r.type===state.type)&&(state.region==='all'||r.region===state.region)&&(state.source==='all'||r.source===state.source)&&contactHas(r._contact,state.contact)&&Ranker.matches(r,prepared));
    stableSort(arr,state,prepared);
    const pg=paginate(arr.length,state.page,36);state.page=pg.page;
    count.innerHTML=`<strong>${fmt(arr.length)}</strong> ${arr.length===1?'result':'results'}`;
    if(!arr.length){results.innerHTML='<div class="empty"><strong>No matches found</strong>Try fewer filters or a broader search.</div>';pager.innerHTML=''}
    else{
      results.innerHTML=arr.slice(pg.start,pg.end).map(r=>`<article class="result-card"><div class="card-top"><div class="entity-icon">${iconFor(r.type)}</div><div class="card-body"><h3><a href="${esc(r.url)}">${esc(r.name)}</a></h3><p>${esc(r.subtitle||r.locality||'Ghana')}</p><div class="meta"><span>${esc(typeLabel(r.type))}</span>${r.region?`<span>${esc(r.region)}</span>`:''}${r.source?`<span>${esc(r.source)}</span>`:''}</div>${contactActions(r._contact)}<div class="card-actions"><span class="freshness">${esc(r.locality||'')}</span><a class="open" href="${esc(r.url)}">Open →</a></div></div></div></article>`).join('');
      renderPager(pager,arr.length,state.page,36,p=>{state.page=p;writeUrl(state,'push');render();window.scrollTo({top:Math.max(0,$('#resultsTop').offsetTop-120),behavior:'smooth'})});
    }
    activeChips($('#activeFilters'),state,k=>{state[k]='all';state.page=1;writeUrl(state,'push');sync();render()});applyView(results,viewBtns,state);
  }
  try{
    const [j,cm]=await Promise.all([fetchFirstJson(['/data/search/national-search-index.compact.json','/data/search/national-search-index.json']),loadContacts()]);
    records=(j.records||[]).map(r=>({...r,_contact:contactFor(cm,r.type,r.name)}));
    const byType={};records.forEach(r=>byType[r.type]=(byType[r.type]||0)+1);$$('[data-type-count]').forEach(el=>el.textContent=fmt(byType[el.dataset.typeCount]||0));
    setOptions(region,unique(records.map(r=>r.region)),'All regions');setOptions(source,unique(records.map(r=>r.source)),'All sources');sync();render();
  }catch(e){results.innerHTML=`<div class="empty"><strong>Could not load national discovery</strong>${esc(e.message)}</div>`;count.textContent='Unavailable'}
  const commit=(mode='push')=>{state.page=1;writeUrl(state,mode);sync();render()};
  q.addEventListener('input',debounce(()=>{state.q=q.value;commit('replace')},90));
  $('#clearSearch')?.addEventListener('click',()=>{state.q='';q.value='';commit('push');q.focus()});
  [type,region,source,contact,sort].forEach(el=>el?.addEventListener('change',()=>{state.type=type.value;state.region=region.value;state.source=source.value;state.contact=contact.value;state.sort=sort.value;commit('push')}));
  $$('[data-type-card]').forEach(b=>b.addEventListener('click',()=>{state.type=state.type===b.dataset.typeCard?'all':b.dataset.typeCard;commit('push')}));
  viewBtns.forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;writeUrl(state,'push');sync();render()}));
  panelInit(()=>{Object.assign(state,{type:'all',region:'all',source:'all',contact:'all',page:1});writeUrl(state,'push');sync();render()});
  addEventListener('popstate',()=>{Object.assign(state,readState());sync();render()});
}
document.addEventListener('DOMContentLoaded',init);
})();
