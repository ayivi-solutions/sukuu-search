(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(Number(n))?Number(n).toLocaleString('en-GH'):String(n??'—');
const title=s=>String(s??'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const unique=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
const slugify=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const normName=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const debounce=(fn,ms=140)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms)}};
const params=()=>new URLSearchParams(location.search);

function readState(defaults){
  const p=params(),state={};
  Object.entries(defaults).forEach(([k,d])=>{
    const raw=p.get(k);
    state[k]=raw===null?d:(typeof d==='number'?(Number(raw)||d):raw);
  });
  return state;
}
function writeUrl(state,defaults,mode='replace'){
  const p=new URLSearchParams();
  Object.entries(state).forEach(([k,v])=>{
    const d=defaults[k];
    if(v===undefined||v===null||v===''||v==='all'||v===d||(k==='page'&&Number(v)===1))return;
    p.set(k,String(v));
  });
  const next=location.pathname+(p.toString()?`?${p}`:'')+location.hash;
  const current=location.pathname+location.search+location.hash;
  if(next===current)return;
  history[mode==='push'?'pushState':'replaceState'](null,'',next);
}
function bindPopState(state,defaults,sync,render){
  addEventListener('popstate',()=>{
    Object.assign(state,readState(defaults));
    sync();
    render();
  });
}
function toast(msg){
  let el=$('.toast');
  if(!el){el=document.createElement('div');el.className='toast';document.body.append(el)}
  el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);
}
function themeInit(){
  const root=document.documentElement,saved=localStorage.getItem('sukuu-theme');
  if(saved)root.dataset.theme=saved;
  $('.theme-button')?.addEventListener('click',()=>{
    const dark=root.dataset.theme==='dark';
    root.dataset.theme=dark?'light':'dark';
    localStorage.setItem('sukuu-theme',root.dataset.theme);
    toast(dark?'Light mode':'Dark mode');
  });
}
function revealInit(){
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches){
    $$('.reveal').forEach(x=>x.classList.add('in'));return;
  }
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
  }),{threshold:.08});
  $$('.reveal').forEach(x=>io.observe(x));
}
function shellInit(){
  themeInit();
  const page=document.body.dataset.page;
  $$('[data-nav]').forEach(a=>{
    if(a.dataset.nav===page||((page==='sources'||page==='model')&&a.dataset.nav==='metadata'))a.setAttribute('aria-current','page');
  });
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#q')?.focus()}
  });
  revealInit();
}
function countUp(el,target){
  target=Number(target);if(!el||!Number.isFinite(target))return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=fmt(target);return}
  const dur=500,start=performance.now();
  const tick=now=>{
    const p=Math.min(1,(now-start)/dur),ease=1-Math.pow(1-p,3);
    el.textContent=Math.round(target*ease).toLocaleString('en-GH');
    if(p<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function panelInit(onReset){
  const panel=$('#filterPanel'),scrim=$('#scrim');
  if(!panel)return;
  const open=()=>{panel.classList.add('open');scrim?.classList.add('open');document.body.style.overflow='hidden'};
  const close=()=>{panel.classList.remove('open');scrim?.classList.remove('open');document.body.style.overflow=''};
  $('#filterOpen')?.addEventListener('click',open);
  $('#filterClose')?.addEventListener('click',close);
  $('#filterApply')?.addEventListener('click',close);
  $('#filterReset')?.addEventListener('click',()=>{onReset?.();close()});
  scrim?.addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}
function setOptions(sel,values,allLabel='All'){
  if(!sel)return;
  const keep=sel.value;
  sel.innerHTML=`<option value="all">${esc(allLabel)}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  if([...sel.options].some(o=>o.value===keep))sel.value=keep;
}
function paginate(total,page,size){
  const pages=Math.max(1,Math.ceil(total/size));
  page=Math.min(Math.max(1,Number(page)||1),pages);
  const start=(page-1)*size;
  return{page,pages,start,end:Math.min(total,start+size)};
}
function renderPager(el,total,page,size,onPage){
  if(!el)return;
  const p=paginate(total,page,size);
  if(p.pages<=1){el.innerHTML='';return}
  const nums=[];
  for(let i=Math.max(1,p.page-2);i<=Math.min(p.pages,p.page+2);i++)nums.push(i);
  el.innerHTML=`<button ${p.page===1?'disabled':''} data-p="${p.page-1}" aria-label="Previous page">‹</button>${p.page>3?'<button data-p="1">1</button><span>…</span>':''}${nums.map(n=>`<button class="${n===p.page?'active':''}" data-p="${n}">${n}</button>`).join('')}${p.page<p.pages-2?`<span>…</span><button data-p="${p.pages}">${p.pages}</button>`:''}<button ${p.page===p.pages?'disabled':''} data-p="${p.page+1}" aria-label="Next page">›</button>`;
  $$('button[data-p]',el).forEach(b=>b.onclick=()=>onPage(Number(b.dataset.p)));
}
function activeChips(container,state,defs,onClear){
  if(!container)return;
  const chips=[];
  defs.forEach(d=>{
    const v=state[d.key];
    if(v&&v!=='all')chips.push(`<span class="chip">${esc(d.label)}: ${esc(d.format?d.format(v):v)} <button data-clear="${d.key}" aria-label="Clear ${esc(d.label)}">×</button></span>`);
  });
  container.innerHTML=chips.join('');
  $$('[data-clear]',container).forEach(b=>b.onclick=()=>onClear(b.dataset.clear));
}
function loading(el,n=6){
  if(el)el.innerHTML=`<div class="loading-grid">${Array.from({length:n},()=>'<div class="skeleton"></div>').join('')}</div>`;
}
function errorState(el,msg){
  if(el)el.innerHTML=`<div class="empty"><strong>Could not load this catalogue</strong>${esc(msg||'Please try again.')}</div>`;
}
async function fetchFirstJson(urls){
  let last;
  for(const url of urls){
    try{
      const r=await fetch(url,{cache:'force-cache'});
      if(r.ok)return await r.json();
      last=new Error(`${r.status} ${url}`);
    }catch(e){last=e}
  }
  throw last||new Error('Data source unavailable');
}

let contactPromise=null,contactMaps=null;
async function loadContacts(){
  if(contactMaps)return contactMaps;
  if(!contactPromise)contactPromise=fetch('/data/contacts/contact-enrichment.json',{cache:'force-cache'})
    .then(r=>{if(!r.ok)throw new Error(`Contacts HTTP ${r.status}`);return r.json()})
    .catch(()=>({records:[]}));
  const j=await contactPromise;
  const maps={tertiary_institution:new Map(),tvet_provider:new Map(),byCategory:new Map()};
  (j.records||[]).forEach(c=>{
    (c.match_names||[]).forEach(n=>{
      const k=normName(n);
      if(k&&!maps[c.entity_type]?.has(k))maps[c.entity_type].set(k,c);
    });
    (c.match_categories||[]).forEach(cat=>{
      const k=`${c.entity_type}:${normName(cat)}`;
      if(!maps.byCategory.has(k))maps.byCategory.set(k,c);
    });
  });
  contactMaps=maps;
  return maps;
}
function contactFor(maps,type,name,category='',allowSupport=true){
  const direct=maps?.[type]?.get(normName(name));
  if(direct)return direct;
  if(!allowSupport||!category)return null;
  return maps?.byCategory?.get(`${type}:${normName(category)}`)||null;
}
function providerContact(maps,subtitle){
  const parts=String(subtitle||'').split(/\s+[·|—–]\s+/).map(x=>x.trim()).filter(Boolean);
  for(const part of parts){
    const a=contactFor(maps,'tertiary_institution',part,'',false)||contactFor(maps,'tvet_provider',part,'',false);
    if(a)return a;
  }
  return null;
}
function scopeOf(c){
  if(!c)return'none';
  if(c.contact_scope==='entity_direct')return'direct';
  if(c.contact_scope==='central_admissions_support')return'support';
  return'other';
}
function hasAnyChannel(c){
  return !!(c&&(c.phones?.length||c.emails?.length||c.website||c.apply_url||c.address||c.whatsapp?.length));
}
function contactHas(c,kind){
  if(kind==='all')return true;
  const scope=scopeOf(c);
  if(kind==='support')return scope==='support'&&hasAnyChannel(c);
  if(kind==='direct'||kind==='any')return scope==='direct'&&hasAnyChannel(c);
  if(scope!=='direct')return false;
  if(kind==='phone')return !!c.phones?.length;
  if(kind==='email')return !!c.emails?.length;
  if(kind==='website')return !!c.website;
  if(kind==='admissions')return !!c.apply_url;
  if(kind==='directions')return !!c.address;
  if(kind==='whatsapp')return !!c.whatsapp?.length;
  return false;
}
function observedAt(c){
  return (c?.sources||[]).map(s=>s.observed_at||'').filter(Boolean).sort().at(-1)||'';
}
function contactLabel(c){
  const scope=scopeOf(c);
  if(scope==='direct')return'Institution-direct verified';
  if(scope==='support')return'Official central support';
  return'Direct contact not yet verified';
}
function contactActions(c,{compact=true}={}){
  if(!c)return'';
  const scope=scopeOf(c),support=scope==='support',items=[];
  const phone=c.phones?.[0],email=c.emails?.[0],wa=c.whatsapp?.[0];
  if(phone)items.push(`<a class="action call ${support?'support':''}" href="tel:${esc(phone.tel||phone.display||phone)}">☎ <span>${support?'Support phone':'Call'}</span></a>`);
  if(email)items.push(`<a class="action email ${support?'support':''}" href="mailto:${esc(email)}">✉ <span>${support?'Support email':'Email'}</span></a>`);
  if(c.apply_url)items.push(`<a class="action apply ${support?'support':''}" href="${esc(c.apply_url)}" target="_blank" rel="noreferrer">↗ <span>${support?'Admissions support':'Apply'}</span></a>`);
  if(wa)items.push(`<a class="action whatsapp" href="https://wa.me/${esc(String(wa).replace(/^\+/,''))}" target="_blank" rel="noreferrer">◉ <span>WhatsApp</span></a>`);
  if(c.website)items.push(`<a class="action website ${support?'support':''}" href="${esc(c.website)}" target="_blank" rel="noreferrer">◎ <span>${support?'Support website':'Website'}</span></a>`);
  if(c.address)items.push(`<a class="action directions" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}" target="_blank" rel="noreferrer">⌖ <span>Directions</span></a>`);
  return `<div class="contact-actions ${compact?'compact':''}" data-contact-scope="${esc(scope)}">${items.slice(0,compact?3:6).join('')}</div>`;
}
function scopeBadge(c){
  const scope=scopeOf(c);
  if(scope==='none')return'';
  return `<span class="contact-scope-badge ${scope}">${esc(contactLabel(c))}</span>`;
}
function freshness(c){
  const when=observedAt(c);
  const label=contactLabel(c);
  return when?`${label} · ${when}`:label;
}
function typeLabel(t){
  return({school:'Schools',tertiary_institution:'Tertiary',tvet_provider:'TVET',programme:'Programmes'}[t]||title(t));
}
function iconFor(t){
  return({school:'🏫',tertiary_institution:'🎓',tvet_provider:'🛠️',programme:'📘',dataset:'▦'}[t]||'◆');
}
function applyView(results,viewBtns,state){
  if(!results)return;
  results.classList.toggle('list',state.view==='list');
  viewBtns.forEach(b=>{
    const on=b.dataset.view===state.view;
    b.classList.toggle('active',on);
    b.setAttribute('aria-pressed',String(on));
  });
}
function verifiedSort(a,b){
  return observedAt(b._contact).localeCompare(observedAt(a._contact))||a.name.localeCompare(b.name);
}
function scrollResults(){
  const el=$('#resultsTop');
  if(el)window.scrollTo({top:Math.max(0,el.offsetTop-120),behavior:'smooth'});
}

async function initDiscover(){
  const defaults={q:'',type:'all',region:'all',source:'all',contact:'all',sort:'relevance',page:1,view:'grid'};
  const state=readState(defaults);
  const q=$('#q'),results=$('#results'),count=$('#resultCount'),pager=$('#pagination'),sort=$('#sort'),region=$('#regionFilter'),source=$('#sourceFilter'),type=$('#typeFilter'),contact=$('#contactFilter'),viewBtns=$$('[data-view]');
  if(!q||!results)return;
  q.value=state.q;loading(results,8);let records=[];

  function sync(){
    q.value=state.q;
    if(type)type.value=state.type;if(region)region.value=state.region;if(source)source.value=state.source;if(contact)contact.value=state.contact;if(sort)sort.value=state.sort;
    $$('[data-type-card]').forEach(b=>b.classList.toggle('active',b.dataset.typeCard===state.type));
    applyView(results,viewBtns,state);
  }
  function score(r,toks,phrase){
    if(!toks.length)return 0;
    let s=0,n=r.name.toLowerCase(),sub=(r.subtitle||'').toLowerCase(),loc=(r.locality||'').toLowerCase(),reg=(r.region||'').toLowerCase(),src=(r.source||'').toLowerCase();
    if(n===phrase)s+=180;else if(n.startsWith(phrase))s+=120;else if(n.includes(phrase))s+=75;
    toks.forEach(t=>{if(n.includes(t))s+=32;if(sub.includes(t))s+=12;if(loc.includes(t))s+=10;if(reg.includes(t))s+=8;if(src.includes(t))s+=5});
    return s;
  }
  function render(){
    const phrase=state.q.trim().toLowerCase(),toks=phrase.split(/\s+/).filter(Boolean);
    let arr=records.filter(r=>(state.type==='all'||r.type===state.type)&&(state.region==='all'||r.region===state.region)&&(state.source==='all'||r.source===state.source)&&contactHas(r._contact,state.contact)&&toks.every(t=>r._s.includes(t)));
    if(state.sort==='relevance'&&toks.length)arr=arr.map(r=>[r,score(r,toks,phrase)]).sort((a,b)=>b[1]-a[1]||a[0].name.localeCompare(b[0].name)).map(x=>x[0]);
    else if(state.sort==='za')arr.sort((a,b)=>b.name.localeCompare(a.name));
    else if(state.sort==='type')arr.sort((a,b)=>typeLabel(a.type).localeCompare(typeLabel(b.type))||a.name.localeCompare(b.name));
    else if(state.sort==='region')arr.sort((a,b)=>(a.region||'ZZZ').localeCompare(b.region||'ZZZ')||a.name.localeCompare(b.name));
    else if(state.sort==='verified')arr.sort(verifiedSort);
    else arr.sort((a,b)=>a.name.localeCompare(b.name));

    const pg=paginate(arr.length,state.page,36);state.page=pg.page;
    count.innerHTML=`<strong>${fmt(arr.length)}</strong> ${arr.length===1?'result':'results'}`;
    if(!arr.length){results.innerHTML='<div class="empty"><strong>No matches found</strong>Try fewer filters or a broader search.</div>';pager.innerHTML=''}
    else{
      results.innerHTML=arr.slice(pg.start,pg.end).map(r=>`<article class="result-card"><div class="card-top"><div class="entity-icon">${iconFor(r.type)}</div><div class="card-body"><h3><a href="${esc(r.url)}">${esc(r.name)}</a></h3><p>${esc(r.subtitle||r.locality||'Ghana')}</p><div class="meta"><span>${esc(typeLabel(r.type))}</span>${r.region?`<span>${esc(r.region)}</span>`:''}${r.source?`<span>${esc(r.source)}</span>`:''}</div>${scopeBadge(r._contact)}${contactActions(r._contact)}<div class="card-actions"><span class="freshness">${esc(r._contact?freshness(r._contact):(r.locality||''))}</span><a class="open" href="${esc(r.url)}">Open →</a></div></div></div></article>`).join('');
      renderPager(pager,arr.length,state.page,36,p=>{state.page=p;writeUrl(state,defaults,'push');render();scrollResults()});
    }
    activeChips($('#activeFilters'),state,[{key:'type',label:'Type',format:typeLabel},{key:'region',label:'Region'},{key:'source',label:'Source'},{key:'contact',label:'Contact',format:title}],k=>{state[k]='all';state.page=1;writeUrl(state,defaults,'push');sync();render()});
    applyView(results,viewBtns,state);
  }

  try{
    const [j,cm]=await Promise.all([fetchFirstJson(['/data/search/national-search-index.compact.json','/data/search/national-search-index.json']),loadContacts()]);
    records=(j.records||[]).map(r=>({...r,_contact:contactFor(cm,r.type,r.name,'',false),_s:[r.name,r.subtitle,r.locality,r.region,r.type,r.source].filter(Boolean).join(' ').toLowerCase()}));
    const byType={};records.forEach(r=>byType[r.type]=(byType[r.type]||0)+1);
    $$('[data-type-count]').forEach(el=>{el.textContent=fmt(byType[el.dataset.typeCount]||0)});
    $$('[data-total-count]').forEach(el=>countUp(el,records.length));
    setOptions(region,unique(records.map(r=>r.region)),'All regions');
    setOptions(source,unique(records.map(r=>r.source)),'All sources');
    sync();render();
  }catch(e){errorState(results,e.message);count.textContent='Unavailable'}

  const commit=(mode='push')=>{state.page=1;writeUrl(state,defaults,mode);sync();render()};
  q.addEventListener('input',debounce(()=>{state.q=q.value;if(!state.q&&state.sort==='relevance')state.sort='az';commit('replace')},90));
  $('#clearSearch')?.addEventListener('click',()=>{state.q='';q.value='';state.page=1;writeUrl(state,defaults,'push');sync();render();q.focus()});
  [type,region,source,contact,sort].forEach(el=>el?.addEventListener('change',()=>{state.type=type?.value||state.type;state.region=region?.value||state.region;state.source=source?.value||state.source;state.contact=contact?.value||state.contact;state.sort=sort?.value||state.sort;commit('push')}));
  $$('[data-type-card]').forEach(b=>b.addEventListener('click',()=>{state.type=state.type===b.dataset.typeCard?'all':b.dataset.typeCard;commit('push')}));
  viewBtns.forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;writeUrl(state,defaults,'push');sync();render()}));
  panelInit(()=>{Object.assign(state,{type:'all',region:'all',source:'all',contact:'all',page:1});writeUrl(state,defaults,'push');sync();render()});
  bindPopState(state,defaults,sync,render);
}

async function initTertiary(){
  const defaults={q:'',category:'all',status:'all',contact:'all',sort:'az',page:1,view:'grid'};
  const state=readState(defaults);
  const q=$('#q'),results=$('#results'),count=$('#resultCount'),pager=$('#pagination'),category=$('#categoryFilter'),status=$('#statusFilter'),contact=$('#contactFilter'),sort=$('#sort'),viewBtns=$$('[data-view]');
  if(!q||!results)return;
  q.value=state.q;loading(results,8);let records=[];

  function sync(){
    q.value=state.q;if(category)category.value=state.category;if(status)status.value=state.status;if(contact)contact.value=state.contact;if(sort)sort.value=state.sort;applyView(results,viewBtns,state);
  }
  function render(){
    const toks=state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let arr=records.filter(r=>(state.category==='all'||r.category===state.category)&&(state.status==='all'||r.status===state.status)&&contactHas(r._contact,state.contact)&&toks.every(t=>r._s.includes(t)));
    if(state.sort==='za')arr.sort((a,b)=>b.name.localeCompare(a.name));
    else if(state.sort==='location')arr.sort((a,b)=>(a.locality||'ZZZ').localeCompare(b.locality||'ZZZ')||a.name.localeCompare(b.name));
    else if(state.sort==='expiry')arr.sort((a,b)=>(a.end||'9999').localeCompare(b.end||'9999')||a.name.localeCompare(b.name));
    else if(state.sort==='category')arr.sort((a,b)=>a.category.localeCompare(b.category)||a.name.localeCompare(b.name));
    else if(state.sort==='verified')arr.sort(verifiedSort);
    else arr.sort((a,b)=>a.name.localeCompare(b.name));

    const pg=paginate(arr.length,state.page,30);state.page=pg.page;
    count.innerHTML=`<strong>${fmt(arr.length)}</strong> institutions`;
    results.innerHTML=arr.length?arr.slice(pg.start,pg.end).map(r=>`<article class="result-card"><div class="card-top"><div class="entity-icon">🎓</div><div class="card-body"><h3><a href="${esc(r.url)}">${esc(r.name)}</a></h3><p>${esc(r.locality||'Location not stated')}</p><div class="meta"><span>${esc(r.category)}</span><span class="badge ${esc(r.status)}">${esc(title(r.status))}</span>${r.end?`<span>Valid to ${esc(r.end)}</span>`:''}</div>${scopeBadge(r._contact)}${contactActions(r._contact)}<div class="card-actions"><span class="freshness">${esc(freshness(r._contact))}</span><a class="open" href="${esc(r.url)}">Details →</a></div></div></div></article>`).join(''):'<div class="empty"><strong>No institutions found</strong>Change the category, status or search.</div>';
    renderPager(pager,arr.length,state.page,30,p=>{state.page=p;writeUrl(state,defaults,'push');render();scrollResults()});
    activeChips($('#activeFilters'),state,[{key:'category',label:'Category'},{key:'status',label:'Status',format:title},{key:'contact',label:'Contact',format:v=>({direct:'Direct verified',support:'Central support',phone:'Direct phone',email:'Direct email',website:'Direct website',admissions:'Direct admissions',directions:'Direct address'}[v]||title(v))}],k=>{state[k]='all';state.page=1;writeUrl(state,defaults,'push');sync();render()});
    applyView(results,viewBtns,state);
  }

  try{
    const [j,cm]=await Promise.all([fetch('/data/entities/gtec-institutions.json',{cache:'force-cache'}).then(r=>r.json()),loadContacts()]);
    records=(j.records||[]).map(r=>{
      const categoryName=r.attributes?.category||r.classifications?.[0]?.value||'Other';
      const locality=r.geography?.locality_text||r.attributes?.source_location||'';
      const authorityId=r.identifiers?.find(x=>x.scheme?.includes('institutionId'))?.value||'';
      const c=contactFor(cm,'tertiary_institution',r.name,categoryName,true);
      return{name:r.name,category:categoryName,locality,status:r.record_status||'unknown',_contact:c,start:r.attributes?.accreditation_start_date||'',end:r.attributes?.accreditation_end_date||'',authorityId,url:authorityId?`/tertiary/${slugify(r.name)}-${authorityId}/`:'/tertiary/',_s:[r.name,categoryName,locality,r.record_status||'',authorityId].join(' ').toLowerCase()};
    });
    setOptions(category,unique(records.map(r=>r.category)),'All categories');
    const sc=records.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});
    const directN=records.filter(r=>contactHas(r._contact,'direct')).length;
    const supportN=records.filter(r=>contactHas(r._contact,'support')).length;
    $$('[data-total-count]').forEach(el=>countUp(el,records.length));
    countUp($('[data-active-count]'),sc.active||0);
    countUp($('[data-category-count]'),unique(records.map(r=>r.category)).length);
    countUp($('[data-contact-count]'),directN);
    const note=$('#contactCoverageNote');
    if(note)note.innerHTML=`<strong>${fmt(directN)}</strong> institution-direct verified · <strong>${fmt(supportN)}</strong> have official central admissions support only. Central support is never counted as an institution-direct contact.`;
    sync();render();
  }catch(e){errorState(results,e.message)}

  const commit=(mode='push')=>{state.page=1;writeUrl(state,defaults,mode);sync();render()};
  q.addEventListener('input',debounce(()=>{state.q=q.value;commit('replace')},90));
  $('#clearSearch')?.addEventListener('click',()=>{state.q='';q.value='';state.page=1;writeUrl(state,defaults,'push');sync();render();q.focus()});
  [category,status,contact,sort].forEach(el=>el?.addEventListener('change',()=>{state.category=category.value;state.status=status.value;state.contact=contact.value;state.sort=sort.value;commit('push')}));
  viewBtns.forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;writeUrl(state,defaults,'push');sync();render()}));
  panelInit(()=>{Object.assign(state,{category:'all',status:'all',contact:'all',page:1});writeUrl(state,defaults,'push');sync();render()});
  bindPopState(state,defaults,sync,render);
}

async function initTvet(){
  const defaults={q:'',category:'all',status:'all',region:'all',contact:'all',sort:'serial',page:1,view:'grid'};
  const state=readState(defaults);
  const q=$('#q'),results=$('#results'),count=$('#resultCount'),pager=$('#pagination'),category=$('#categoryFilter'),status=$('#statusFilter'),region=$('#regionFilter'),contact=$('#contactFilter'),sort=$('#sort'),viewBtns=$$('[data-view]');
  if(!q||!results)return;
  q.value=state.q;loading(results,8);let records=[];

  function sync(){q.value=state.q;category.value=state.category;status.value=state.status;region.value=state.region;if(contact)contact.value=state.contact;sort.value=state.sort;applyView(results,viewBtns,state)}
  function render(){
    const toks=state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let arr=records.filter(r=>(state.category==='all'||r.category===state.category)&&(state.status==='all'||r.status===state.status)&&(state.region==='all'||r.region===state.region)&&contactHas(r._contact,state.contact)&&toks.every(t=>r._s.includes(t)));
    if(state.sort==='az')arr.sort((a,b)=>a.name.localeCompare(b.name));
    else if(state.sort==='za')arr.sort((a,b)=>b.name.localeCompare(a.name));
    else if(state.sort==='region')arr.sort((a,b)=>(a.region||'ZZZ').localeCompare(b.region||'ZZZ')||a.name.localeCompare(b.name));
    else if(state.sort==='occurrences')arr.sort((a,b)=>b.occurrences-a.occurrences||a.name.localeCompare(b.name));
    else if(state.sort==='verified')arr.sort(verifiedSort);
    else arr.sort((a,b)=>a.serial-b.serial);

    const pg=paginate(arr.length,state.page,30);state.page=pg.page;
    count.innerHTML=`<strong>${fmt(arr.length)}</strong> providers`;
    results.innerHTML=arr.length?arr.slice(pg.start,pg.end).map(r=>`<article class="result-card"><div class="card-top"><div class="entity-icon">${String(r.serial).padStart(3,'0')}</div><div class="card-body"><h3><a href="${esc(r.url)}">${esc(r.name)}</a></h3><p>${esc(r.locality||'Location not stated')}</p><div class="meta"><span>${esc(r.category)}</span><span class="badge ${esc(r.status)}">${esc(title(r.status))}</span>${r.region?`<span>${esc(r.region)}</span>`:''}<span>${fmt(r.occurrences)} programme records</span></div>${scopeBadge(r._contact)}${contactActions(r._contact)}<div class="card-actions"><span class="freshness">${esc(freshness(r._contact))}</span><a class="open" href="${esc(r.url)}">Details →</a></div></div></div></article>`).join(''):'<div class="empty"><strong>No providers found</strong>Change the filters or search terms.</div>';
    renderPager(pager,arr.length,state.page,30,p=>{state.page=p;writeUrl(state,defaults,'push');render();scrollResults()});
    activeChips($('#activeFilters'),state,[{key:'category',label:'Category'},{key:'status',label:'Status',format:title},{key:'region',label:'Region'},{key:'contact',label:'Contact',format:v=>({direct:'Direct verified',phone:'Direct phone',email:'Direct email',website:'Direct website',admissions:'Direct admissions',directions:'Direct address'}[v]||title(v))}],k=>{state[k]='all';state.page=1;writeUrl(state,defaults,'push');sync();render()});
    applyView(results,viewBtns,state);
  }

  try{
    const [j,cm]=await Promise.all([fetch('/data/entities/ctvet-providers.json',{cache:'force-cache'}).then(r=>r.json()),loadContacts()]);
    records=(j.records||[]).map(r=>{
      const serial=Number(r.attributes?.source_serial||r.identifiers?.find(x=>x.scheme?.includes('serial'))?.value||0);
      const categoryName=r.attributes?.source_category||r.classifications?.[0]?.value||'Other';
      const locality=r.geography?.locality_text||r.attributes?.source_location||'';
      const regionName=r.geography?.region_name||'';
      const code=r.identifiers?.find(x=>x.scheme?.includes('accreditation code'))?.value||r.attributes?.accreditation_codes_raw?.[0]||'';
      const c=contactFor(cm,'tvet_provider',r.name,'',false);
      return{name:r.name,serial,category:categoryName,locality,region:regionName,status:r.record_status||'unknown',_contact:c,occurrences:Number(r.attributes?.occurrence_count||0),code,url:serial?`/tvet/${slugify(r.name)}-${String(serial).padStart(3,'0')}/`:'/tvet/',_s:[r.name,categoryName,locality,regionName,r.record_status||'',code,serial].join(' ').toLowerCase()};
    });
    setOptions(category,unique(records.map(r=>r.category)),'All categories');
    setOptions(region,unique(records.map(r=>r.region)),'All regions');
    const sc=records.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{});
    $$('[data-total-count]').forEach(el=>countUp(el,records.length));
    countUp($('[data-active-count]'),sc.active||0);
    countUp($('[data-region-count]'),unique(records.map(r=>r.region)).length);
    countUp($('[data-contact-count]'),records.filter(r=>contactHas(r._contact,'direct')).length);
    sync();render();
  }catch(e){errorState(results,e.message)}

  const commit=(mode='push')=>{state.page=1;writeUrl(state,defaults,mode);sync();render()};
  q.addEventListener('input',debounce(()=>{state.q=q.value;commit('replace')},90));
  $('#clearSearch')?.addEventListener('click',()=>{state.q='';q.value='';state.page=1;writeUrl(state,defaults,'push');sync();render();q.focus()});
  [category,status,region,contact,sort].forEach(el=>el?.addEventListener('change',()=>{state.category=category.value;state.status=status.value;state.region=region.value;state.contact=contact.value;state.sort=sort.value;commit('push')}));
  viewBtns.forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;writeUrl(state,defaults,'push');sync();render()}));
  panelInit(()=>{Object.assign(state,{category:'all',status:'all',region:'all',contact:'all',page:1});writeUrl(state,defaults,'push');sync();render()});
  bindPopState(state,defaults,sync,render);
}

async function initProgrammes(){
  const defaults={q:'',source:'all',region:'all',contact:'all',sort:'az',page:1,view:'grid'};
  const state=readState(defaults);
  const q=$('#q'),results=$('#results'),count=$('#resultCount'),pager=$('#pagination'),source=$('#sourceFilter'),region=$('#regionFilter'),contact=$('#contactFilter'),sort=$('#sort'),viewBtns=$$('[data-view]');
  if(!q||!results)return;
  q.value=state.q;loading(results,8);let records=[];

  function sync(){q.value=state.q;source.value=state.source;region.value=state.region;if(contact)contact.value=state.contact;sort.value=state.sort;applyView(results,viewBtns,state)}
  function render(){
    const toks=state.q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let arr=records.filter(r=>(state.source==='all'||r.source===state.source)&&(state.region==='all'||r.region===state.region)&&contactHas(r._contact,state.contact)&&toks.every(t=>r._s.includes(t)));
    if(state.sort==='za')arr.sort((a,b)=>b.name.localeCompare(a.name));
    else if(state.sort==='source')arr.sort((a,b)=>(a.source||'').localeCompare(b.source||'')||a.name.localeCompare(b.name));
    else if(state.sort==='region')arr.sort((a,b)=>(a.region||'ZZZ').localeCompare(b.region||'ZZZ')||a.name.localeCompare(b.name));
    else if(state.sort==='verified')arr.sort(verifiedSort);
    else arr.sort((a,b)=>a.name.localeCompare(b.name));

    const pg=paginate(arr.length,state.page,36);state.page=pg.page;
    count.innerHTML=`<strong>${fmt(arr.length)}</strong> programme records`;
    results.innerHTML=arr.length?arr.slice(pg.start,pg.end).map(r=>`<article class="result-card"><div class="card-top"><div class="entity-icon">📘</div><div class="card-body"><h3><a href="${esc(r.url)}">${esc(r.name)}</a></h3><p>${esc(r.subtitle||'Accredited programme')}</p><div class="meta">${r.source?`<span>${esc(r.source)}</span>`:''}${r.region?`<span>${esc(r.region)}</span>`:''}${r.locality?`<span>${esc(r.locality)}</span>`:''}</div>${scopeBadge(r._contact)}${contactActions(r._contact)}<div class="card-actions"><span class="freshness">${esc(r._contact?freshness(r._contact):'Provider direct contact not yet verified')}</span><a class="open" href="${esc(r.url)}">Open record →</a></div></div></div></article>`).join(''):'<div class="empty"><strong>No programmes found</strong>Try another programme name, source or region.</div>';
    renderPager(pager,arr.length,state.page,36,p=>{state.page=p;writeUrl(state,defaults,'push');render();scrollResults()});
    activeChips($('#activeFilters'),state,[{key:'source',label:'Authority'},{key:'region',label:'Region'},{key:'contact',label:'Provider contact',format:v=>({direct:'Direct verified',phone:'Direct phone',email:'Direct email',website:'Direct website',admissions:'Direct admissions',directions:'Direct address'}[v]||title(v))}],k=>{state[k]='all';state.page=1;writeUrl(state,defaults,'push');sync();render()});
    applyView(results,viewBtns,state);
  }

  try{
    const [j,cm]=await Promise.all([fetchFirstJson(['/data/search/programme-search-index.json','/data/search/national-search-index.compact.json','/data/search/national-search-index.json']),loadContacts()]);
    records=(j.records||[]).filter(r=>r.type==='programme').map(r=>({...r,_contact:providerContact(cm,r.subtitle),_s:[r.name,r.subtitle,r.locality,r.region,r.source].filter(Boolean).join(' ').toLowerCase()}));
    setOptions(source,unique(records.map(r=>r.source)),'All authorities');
    setOptions(region,unique(records.map(r=>r.region)),'All regions');
    $$('[data-total-count]').forEach(el=>countUp(el,records.length));
    countUp($('[data-authority-count]'),unique(records.map(r=>r.source)).length);
    sync();render();
  }catch(e){errorState(results,e.message)}

  const commit=(mode='push')=>{state.page=1;writeUrl(state,defaults,mode);sync();render()};
  q.addEventListener('input',debounce(()=>{state.q=q.value;commit('replace')},90));
  $('#clearSearch')?.addEventListener('click',()=>{state.q='';q.value='';state.page=1;writeUrl(state,defaults,'push');sync();render();q.focus()});
  [source,region,contact,sort].forEach(el=>el?.addEventListener('change',()=>{state.source=source.value;state.region=region.value;state.contact=contact.value;state.sort=sort.value;commit('push')}));
  viewBtns.forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;writeUrl(state,defaults,'push');sync();render()}));
  panelInit(()=>{Object.assign(state,{source:'all',region:'all',contact:'all',page:1});writeUrl(state,defaults,'push');sync();render()});
  bindPopState(state,defaults,sync,render);
}

document.addEventListener('DOMContentLoaded',()=>{
  shellInit();
  const page=document.body.dataset.page;
  ({discover:initDiscover,tertiary:initTertiary,tvet:initTvet,programmes:initProgrammes}[page]||(()=>{}))();
});
})();
