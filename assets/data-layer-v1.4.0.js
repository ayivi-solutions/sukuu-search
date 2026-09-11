(()=>{
'use strict';

const nativeFetch=window.fetch.bind(window);
const SUPPLEMENT='/data/contacts/contact-enrichment-v1.4.0.json';

function asUrl(input){
  try{return new URL(typeof input==='string'?input:input?.url,location.href)}catch{return null}
}
function jsonResponse(payload,sourceResponse){
  const headers=new Headers(sourceResponse?.headers||{});
  headers.set('content-type','application/json; charset=utf-8');
  headers.delete('content-length');
  return new Response(JSON.stringify(payload),{
    status:sourceResponse?.status||200,
    statusText:sourceResponse?.statusText||'OK',
    headers
  });
}
async function loadSupplement(init){
  try{
    const r=await nativeFetch(SUPPLEMENT,{...(init||{}),cache:'no-cache'});
    if(!r.ok)return{records:[]};
    const j=await r.json();
    return j&&Array.isArray(j.records)?j:{records:[]};
  }catch{return{records:[]}}
}
function normalizeRecordStatus(record){
  const end=record?.attributes?.accreditation_end_date;
  if(!end||!/^\d{4}-\d{2}-\d{2}$/.test(end))return record;
  const today=new Date().toISOString().slice(0,10);
  record.record_status=end<today?'expired':'active';
  record.status_basis='accreditation_end_date';
  return record;
}

window.fetch=async function(input,init){
  const url=asUrl(input);
  if(!url)return nativeFetch(input,init);

  if(url.origin===location.origin&&url.pathname==='/data/contacts/contact-enrichment.json'){
    const baseResponse=await nativeFetch(input,init);
    if(!baseResponse.ok)return baseResponse;
    const base=await baseResponse.json();
    const supplement=await loadSupplement(init);
    const records=[...(Array.isArray(base.records)?base.records:[]),...(supplement.records||[])];
    return jsonResponse({
      ...base,
      runtime_release:'1.4.0',
      supplements:[SUPPLEMENT],
      record_count:records.length,
      records
    },baseResponse);
  }

  if(url.origin===location.origin&&url.pathname==='/data/entities/gtec-institutions.json'){
    const response=await nativeFetch(input,init);
    if(!response.ok)return response;
    const payload=await response.json();
    if(Array.isArray(payload.records))payload.records.forEach(normalizeRecordStatus);
    payload.runtime_status_policy='date_driven_accreditation_end_date';
    payload.runtime_release='1.4.0';
    return jsonResponse(payload,response);
  }

  return nativeFetch(input,init);
};

window.SukuuDataLayer={
  release:'1.4.0',
  contactSupplement:SUPPLEMENT,
  accreditationStatusPolicy:'expired when accreditation_end_date is before the current ISO date'
};
})();
