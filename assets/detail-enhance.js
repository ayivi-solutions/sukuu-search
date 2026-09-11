(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const path=location.pathname;
const page=path.startsWith('/tertiary/')?'tertiary':path.startsWith('/tvet/')?'tvet':path.startsWith('/programme/')?'programmes':'discover';
const SUPPLEMENT='/data/contacts/contact-enrichment-v1.4.0.json';

function ensurePatchCss(){
  ['/assets/national-patch-v1.3.1.css','/assets/national-patch-v1.4.0.css'].forEach(href=>{
    if(document.querySelector(`link[href="${href}"]`))return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    document.head.append(link);
  });
}
function header(){
  const old=$('header'); if(!old)return;
  old.className='app-header';
  old.innerHTML=`<div class="head"><a class="brand-link" href="/discover/"><span class="mark">★</span><span class="brand">Sukuu Search<small>Ghana national discovery</small></span></a><nav class="top-nav" aria-label="Primary"><a data-nav="discover" href="/discover/">Discover</a><a data-nav="schools" href="/">Schools</a><a data-nav="tertiary" href="/tertiary/">Tertiary</a><a data-nav="tvet" href="/tvet/">TVET</a><a data-nav="programmes" href="/programmes/">Programmes</a><a data-nav="metadata" href="/metadata/">Data</a></nav><button class="icon-btn theme-button" type="button" aria-label="Toggle theme">◐</button></div>`;
  $$('[data-nav]').forEach(a=>{if(a.dataset.nav===page)a.setAttribute('aria-current','page')});
  const saved=localStorage.getItem('sukuu-theme');if(saved)document.documentElement.dataset.theme=saved;
  $('.theme-button')?.addEventListener('click',()=>{
    const dark=document.documentElement.dataset.theme==='dark';
    document.documentElement.dataset.theme=dark?'light':'dark';
    localStorage.setItem('sukuu-theme',document.documentElement.dataset.theme);
  });
  if(!$('.mobile-nav'))document.body.insertAdjacentHTML('beforeend',`<nav class="mobile-nav" aria-label="Mobile navigation"><a data-nav="discover" href="/discover/"><span>⌕</span><span>Discover</span></a><a data-nav="schools" href="/"><span>🏫</span><span>Schools</span></a><a data-nav="tertiary" href="/tertiary/"><span>🎓</span><span>Tertiary</span></a><a data-nav="tvet" href="/tvet/"><span>🛠️</span><span>TVET</span></a><a data-nav="programmes" href="/programmes/"><span>📘</span><span>Programmes</span></a></nav>`);
  $$('[data-nav]',$('.mobile-nav')).forEach(a=>{if(a.dataset.nav===page)a.setAttribute('aria-current','page')});
}
async function contactRecords(url){
  try{
    const r=await fetch(url,{cache:url===SUPPLEMENT?'no-cache':'force-cache'});
    if(!r.ok)return[];
    const j=await r.json();
    return j.records||[];
  }catch{return[]}
}
async function contacts(){
  const [base,supplement]=await Promise.all([
    contactRecords('/data/contacts/contact-enrichment.json'),
    contactRecords(SUPPLEMENT)
  ]);
  return [...base,...supplement];
}
function index(records){
  const maps={tertiary_institution:new Map(),tvet_provider:new Map(),byCategory:new Map()};
  records.forEach(c=>{
    (c.match_names||[]).forEach(n=>{
      const k=norm(n);
      if(k&&!maps[c.entity_type]?.has(k))maps[c.entity_type].set(k,c);
    });
    (c.match_categories||[]).forEach(cat=>{
      const k=`${c.entity_type}:${norm(cat)}`;
      if(!maps.byCategory.has(k))maps.byCategory.set(k,c);
    });
  });
  return maps;
}
function lookup(maps,type,name,category=''){
  const direct=maps[type]?.get(norm(name));
  if(direct)return direct;
  return category?maps.byCategory?.get(`${type}:${norm(category)}`)||null:null;
}
function scopeOf(c){
  if(!c)return'none';
  if(c.contact_scope==='entity_direct')return'direct';
  if(c.contact_scope==='central_admissions_support')return'support';
  return'other';
}
function directions(address){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
function actions(c){
  const a=[],scope=scopeOf(c),support=scope==='support';
  const phone=c.phones?.[0],email=c.emails?.[0],wa=c.whatsapp?.[0];
  if(phone)a.push(`<a class="contact-action call ${support?'support':''}" href="tel:${esc(phone.tel||phone.display||phone)}"><b>☎</b><span>${support?'Support phone':'Call'}<small>${esc(phone.display||phone.tel||phone)}</small></span></a>`);
  if(email)a.push(`<a class="contact-action email ${support?'support':''}" href="mailto:${esc(email)}"><b>✉</b><span>${support?'Support email':'Email'}<small>${esc(email)}</small></span></a>`);
  if(c.apply_url)a.push(`<a class="contact-action apply ${support?'support':''}" target="_blank" rel="noreferrer" href="${esc(c.apply_url)}"><b>↗</b><span>${support?'Admissions support':'Apply / Admissions'}<small>Open official portal</small></span></a>`);
  if(wa)a.push(`<a class="contact-action whatsapp" target="_blank" rel="noreferrer" href="https://wa.me/${esc(String(wa).replace(/^\+/,''))}"><b>◉</b><span>WhatsApp<small>${esc(wa)}</small></span></a>`);
  if(c.website)a.push(`<a class="contact-action website ${support?'support':''}" target="_blank" rel="noreferrer" href="${esc(c.website)}"><b>◎</b><span>${support?'Support website':'Website'}<small>${support?'Official support source':'Official institution site'}</small></span></a>`);
  if(c.address)a.push(`<a class="contact-action directions" target="_blank" rel="noreferrer" href="${directions(c.address)}"><b>⌖</b><span>Directions<small>${esc(c.address)}</small></span></a>`);
  return a.join('');
}
function panel(c,title='Contact & admissions'){
  if(!c)return `<section class="contact-panel unavailable"><div class="contact-head"><div><span class="contact-kicker">Connect</span><h2>${esc(title)}</h2></div><span class="contact-verified muted">Direct verification pending</span></div><p>Institution-direct operational contact details are not yet verified in this Sukuu record.</p></section>`;
  const src=c.sources?.[0],scope=scopeOf(c),support=scope==='support';
  const kicker=support?'Official central admissions support':'Connect directly';
  const verified=support?'✓ Official support source':'✓ Institution-direct source';
  const releaseTag=c.entity_ids?.length?'<span class="release-tag">v1.4 verified</span>':'';
  return `<section class="contact-panel ${support?'support-scope':''}"><div class="contact-head"><div><span class="contact-kicker">${kicker}</span><h2>${esc(title)}</h2></div><span class="contact-verified">${verified}</span></div>${support?'<p class="scope-warning"><strong>Not institution-direct:</strong> this is an official central admissions/support channel associated with the institution category. It is shown as fallback help and is not counted as the institution’s own phone, email or website.</p>':''}<div class="contact-action-grid">${actions(c)}</div>${c.emails?.length>1?`<div class="contact-more"><strong>Other verified emails</strong>${c.emails.slice(1).map(e=>`<a href="mailto:${esc(e)}">${esc(e)}</a>`).join('')}</div>`:''}${c.phones?.length>1?`<div class="contact-more"><strong>Other verified phones</strong>${c.phones.slice(1).map(p=>`<a href="tel:${esc(p.tel||p.display||p)}">${esc(p.display||p.tel||p)}</a>`).join('')}</div>`:''}${src?`<details class="contact-source"><summary>Contact source & verification ${releaseTag}</summary><p>${esc(src.name||'Official public source')} · observed ${esc(src.observed_at||'')}</p><a target="_blank" rel="noreferrer" href="${esc(src.url)}">View contact source</a>${c.notes?`<p>${esc(c.notes)}</p>`:''}</details>`:''}</section>`;
}
function collapseProvenance(){
  const candidates=$$('article.card, .card'),move=[];
  candidates.forEach(card=>{
    const h=$('h2,h3',card)?.textContent?.trim().toLowerCase()||'';
    if(h.includes('authority record')||h.includes('authority identifiers'))move.push(card);
  });
  const external=$$('a[href*="gtec.edu.gh"],a[href*="ctvet.gov.gh"]');
  external.forEach(a=>{a.textContent='Authority source evidence';a.target='_blank';a.rel='noreferrer'});
  if(!move.length&&!external.length)return;
  let details=$('.provenance-details');
  if(!details){
    details=document.createElement('details');
    details.className='provenance-details';
    details.innerHTML='<summary>Data provenance</summary><div class="provenance-body"><p>Regulatory identifiers and authority-source evidence are retained here for traceability. They are not the primary user action.</p></div>';
    $('main')?.append(details);
  }
  const body=$('.provenance-body',details);
  move.forEach(card=>{card.remove();body.append(card)});
  external.forEach(a=>{
    if(!details.contains(a)){
      const p=document.createElement('p');
      p.append(a.cloneNode(true));
      body.append(p);
      const own=a.closest('p');
      if(own&&own.textContent.trim()===a.textContent.trim())own.remove();else a.remove();
    }
  });
}
function cleanExplanatoryNotes(){
  $$('.note').forEach(n=>{
    const t=n.textContent.toLowerCase();
    if(t.includes('official gtec observation')||t.includes('provider state is derived')||t.includes('register serial')){
      n.classList.add('data-note');
      n.innerHTML='<strong>Record status</strong><span>'+esc(n.textContent.replace(/Official GTEC observation:?/i,'').replace(/Accreditation is time-sensitive; verify consequential decisions against GTEC\.?/i,'').trim())+'</span>';
    }
  });
}
function applyDateDrivenAccreditationStatus(){
  if(page!=='tertiary')return;
  const periodCard=$$('article.card,.card').find(card=>($('h2,h3',card)?.textContent||'').trim().toLowerCase()==='accreditation period');
  const text=$('p',periodCard)?.textContent||'';
  const match=text.match(/(\d{4}-\d{2}-\d{2})\s*(?:→|->|–|-)\s*(\d{4}-\d{2}-\d{2})/);
  if(!match)return;
  const end=match[2],today=new Date().toISOString().slice(0,10),expired=end<today;
  $$('.stat').forEach(stat=>{
    const label=$('span',stat)?.textContent?.trim().toLowerCase()||'';
    if(label==='institution status'){
      const strong=$('strong',stat);
      if(strong)strong.textContent=expired?'Expired':'Active';
    }
  });
  let note=$('.date-derived-status',periodCard);
  if(!note){
    note=document.createElement('p');
    note.className='date-derived-status';
    periodCard?.append(note);
  }
  if(note){
    note.classList.toggle('expired',expired);
    note.innerHTML=expired?`<strong>Expired</strong> · accreditation end date passed on ${esc(end)}.`:`<strong>Active</strong> · accreditation valid through ${esc(end)}.`;
  }
}
function addBreadcrumbs(){
  if($('.breadcrumbs'))return;
  const main=$('main'),hero=$('.hero');
  if(!main||!hero)return;
  const b=document.createElement('nav');
  b.className='breadcrumbs';
  let html='<a href="/discover/">Discover</a><span>›</span>';
  if(page==='tertiary')html+='<a href="/tertiary/">Tertiary</a><span>›</span>';
  else if(page==='tvet')html+='<a href="/tvet/">TVET</a><span>›</span>';
  else html+='<a href="/programmes/">Programmes</a><span>›</span>';
  html+='<span>Record</span>';
  b.innerHTML=html;
  main.insertBefore(b,hero);
}
async function run(){
  ensurePatchCss();
  document.body.dataset.page=page;
  header();
  addBreadcrumbs();
  cleanExplanatoryNotes();
  applyDateDrivenAccreditationStatus();
  const maps=index(await contacts());

  if(page==='tertiary'||page==='tvet'){
    const name=$('.hero h1')?.textContent?.trim()||$('h1')?.textContent?.trim()||'';
    const type=page==='tertiary'?'tertiary_institution':'tvet_provider';
    let category='';
    $$('.stat').forEach(x=>{
      const label=$('span',x)?.textContent?.toLowerCase()||'';
      if(label.includes('category'))category=$('strong',x)?.textContent?.trim()||'';
    });
    const c=lookup(maps,type,name,category),stats=$('.stats');
    if(stats&&!$('.contact-panel')){
      const heading=page==='tertiary'?(scopeOf(c)==='support'?'Admissions support':'Contact & admissions'):'Contact provider';
      stats.insertAdjacentHTML('afterend',panel(c,heading));
    }
  }else if(page==='programmes'){
    const providerLink=$('article.card a[href^="/tertiary/"],article.card a[href^="/tvet/"]');
    if(providerLink){
      const type=providerLink.getAttribute('href').startsWith('/tvet/')?'tvet_provider':'tertiary_institution';
      const c=lookup(maps,type,providerLink.textContent.trim());
      const card=providerLink.closest('article.card');
      card?.insertAdjacentHTML('afterend',panel(c,'Contact programme provider'));
    }
  }
  collapseProvenance();
}
document.addEventListener('DOMContentLoaded',run);
})();
