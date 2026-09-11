(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SukuuSearchRanker=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const VERSION='1.5.0';
  const ENTITY_ALIASES={
    'ug':'university of ghana',
    'knust':'kwame nkrumah university of science and technology',
    'ucc':'university of cape coast',
    'uew':'university of education winneba',
    'uds':'university for development studies',
    'umat':'university of mines and technology',
    'gctu':'ghana communication technology university',
    'atu':'accra technical university',
    'ktu':'koforidua technical university',
    'ttu':'takoradi technical university',
    'htu':'ho technical university',
    'cctu':'cape coast technical university',
    'stu':'sunyani technical university',
    'ibmj':'institute of business management and journalism',
    'precevid':'presbyterian centre for vocational instructors development'
  };
  const TOKEN_ALIASES={
    'shs':['senior','high','school'],
    'sec':['secondary'],
    'tech':['technical'],
    'uni':['university']
  };
  const TYPE_TERMS={
    school:['school','senior high','secondary','basic','primary','kindergarten'],
    tertiary_institution:['university','college','polytechnic','tertiary','institute'],
    tvet_provider:['tvet','technical','vocational','skills','training'],
    programme:['programme','program','degree','diploma','certificate','course']
  };

  function normalize(value){
    return String(value??'')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g,'')
      .toLowerCase()
      .replace(/&/g,' and ')
      .replace(/[’'`]/g,'')
      .replace(/[^a-z0-9]+/g,' ')
      .trim()
      .replace(/\s+/g,' ');
  }
  function words(value){return normalize(value).split(' ').filter(Boolean)}
  function unique(values){return [...new Set(values.filter(Boolean))]}
  function expandQuery(query){
    const raw=normalize(query);
    const entityAlias=ENTITY_ALIASES[raw];
    const phrase=entityAlias||raw;
    const expanded=[];
    for(const token of words(phrase)){
      if(TOKEN_ALIASES[token])expanded.push(...TOKEN_ALIASES[token]);
      else expanded.push(token);
    }
    return{
      raw,
      phrase:normalize(expanded.join(' ')),
      tokens:unique(expanded.map(normalize)),
      usedEntityAlias:!!entityAlias,
      entityAlias:entityAlias||null
    };
  }
  function recordFields(record){
    const name=normalize(record?.name);
    const subtitle=normalize(record?.subtitle);
    const locality=normalize(record?.locality);
    const region=normalize(record?.region);
    const type=normalize(record?.type);
    const source=normalize(record?.source);
    const nameWords=name.split(' ').filter(Boolean);
    return{name,subtitle,locality,region,type,source,nameWords,all:[name,subtitle,locality,region,type,source].filter(Boolean).join(' ')};
  }
  function tokenHit(field,token){
    if(!field||!token)return false;
    if(field===token||field.includes(` ${token} `)||field.startsWith(`${token} `)||field.endsWith(` ${token}`))return true;
    return field.split(' ').some(word=>word.startsWith(token));
  }
  function matches(record,prepared){
    if(!prepared?.tokens?.length)return true;
    const f=recordFields(record);
    return prepared.tokens.every(token=>tokenHit(f.all,token));
  }
  function inferredTypeBoost(type,prepared){
    if(!type||!prepared?.phrase)return 0;
    const terms=TYPE_TERMS[type]||[];
    return terms.some(term=>prepared.phrase.includes(normalize(term)))?45:0;
  }
  function score(record,prepared){
    if(!prepared?.tokens?.length)return 0;
    const f=recordFields(record),phrase=prepared.phrase;
    let s=0;
    if(f.name===phrase)s+=1200;
    else if(f.name.startsWith(`${phrase} `))s+=900;
    else if(f.name.includes(phrase))s+=720;

    if(prepared.usedEntityAlias&&f.name===prepared.entityAlias)s+=500;
    if(f.subtitle===phrase)s+=520;
    else if(f.subtitle.startsWith(`${phrase} `))s+=360;
    else if(f.subtitle.includes(phrase))s+=280;
    if(f.locality===phrase)s+=320;
    else if(f.locality.includes(phrase))s+=210;
    if(f.region===phrase)s+=190;
    else if(f.region.includes(phrase))s+=120;

    let nameExactTokens=0,namePrefixTokens=0,subtitleTokens=0,localityTokens=0,regionTokens=0,sourceTokens=0;
    for(const token of prepared.tokens){
      if(f.nameWords.includes(token))nameExactTokens++;
      else if(f.nameWords.some(word=>word.startsWith(token)))namePrefixTokens++;
      if(tokenHit(f.subtitle,token))subtitleTokens++;
      if(tokenHit(f.locality,token))localityTokens++;
      if(tokenHit(f.region,token))regionTokens++;
      if(tokenHit(f.source,token))sourceTokens++;
    }
    if(nameExactTokens===prepared.tokens.length)s+=560;
    s+=nameExactTokens*92;
    s+=namePrefixTokens*58;
    s+=subtitleTokens*32;
    s+=localityTokens*26;
    s+=regionTokens*18;
    s+=sourceTokens*10;
    s+=inferredTypeBoost(record?.type,prepared);

    if(f.name&&phrase&&f.name.split(' ').length<7)s+=12;
    return s;
  }
  function compare(a,b,prepared){
    const ds=score(b,prepared)-score(a,prepared);
    if(ds)return ds;
    const an=normalize(a?.name),bn=normalize(b?.name);
    if(an!==bn)return an.localeCompare(bn);
    return normalize(a?.url).localeCompare(normalize(b?.url));
  }
  function filterRecord(record,filters={}){
    if(filters.type&&filters.type!=='all'&&record.type!==filters.type)return false;
    if(filters.region&&filters.region!=='all'&&record.region!==filters.region)return false;
    if(filters.source&&filters.source!=='all'&&record.source!==filters.source)return false;
    return true;
  }
  function search(records,query,{filters={},limit=null}={}){
    const prepared=expandQuery(query);
    let out=(records||[]).filter(record=>filterRecord(record,filters)&&matches(record,prepared));
    out.sort((a,b)=>compare(a,b,prepared));
    if(Number.isFinite(limit))out=out.slice(0,Math.max(0,limit));
    return{query:prepared,records:out};
  }

  return{VERSION,ENTITY_ALIASES,TOKEN_ALIASES,normalize,expandQuery,recordFields,matches,score,compare,search};
});
