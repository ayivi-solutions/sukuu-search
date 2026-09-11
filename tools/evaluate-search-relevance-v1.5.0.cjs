'use strict';
const fs=require('fs');
const path=require('path');
const Ranker=require('../assets/search-ranker-v1.5.0.js');

const root=path.resolve(__dirname,'..');
const indexPath=path.join(root,'data/search/national-search-index.compact.json');
const goldPath=path.join(root,'tests/search-relevance-gold-v1.5.0.json');
const reportPath=process.env.SEARCH_RELEVANCE_REPORT||path.join(root,'SEARCH-RELEVANCE-REPORT-v1.5.0.json');
const index=JSON.parse(fs.readFileSync(indexPath,'utf8'));
const gold=JSON.parse(fs.readFileSync(goldPath,'utf8'));
const records=index.records||[];

function norm(v){return Ranker.normalize(v)}
function expectedMatch(record,expected={}){
  if(expected.type&&record.type!==expected.type)return false;
  if(expected.name&&norm(record.name)!==norm(expected.name))return false;
  if(expected.any_names?.length&&!expected.any_names.some(n=>norm(record.name)===norm(n)))return false;
  if(expected.name_tokens?.length){
    const name=norm(record.name);
    if(!expected.name_tokens.every(t=>name.includes(norm(t))))return false;
  }
  if(expected.locality_contains&&!norm(record.locality).includes(norm(expected.locality_contains)))return false;
  if(expected.region&&norm(record.region)!==norm(expected.region))return false;
  if(expected.source&&norm(record.source)!==norm(expected.source))return false;
  return true;
}
function round(n,d=4){const p=10**d;return Math.round(n*p)/p}

const positive=[];
for(const c of gold.positive_cases||[]){
  const result=Ranker.search(records,c.query,{filters:c.filters||{}});
  const rank=result.records.findIndex(r=>expectedMatch(r,c.expected))+1;
  positive.push({
    id:c.id,category:c.category,query:c.query,rank:rank||null,max_rank:c.max_rank||5,passed:!!rank&&rank<=(c.max_rank||5),
    result_count:result.records.length,
    expected:c.expected,
    top5:result.records.slice(0,5).map(r=>({name:r.name,type:r.type,locality:r.locality||null,region:r.region||null,url:r.url||null,score:Ranker.score(r,result.query)}))
  });
}
const negative=[];
for(const c of gold.negative_cases||[]){
  const result=Ranker.search(records,c.query,{filters:c.filters||{},limit:5});
  negative.push({id:c.id,query:c.query,result_count:result.records.length,passed:result.records.length===0,top5:result.records.map(r=>({name:r.name,type:r.type,url:r.url||null}))});
}

const n=positive.length||1;
const exact=positive.filter(x=>x.category==='exact_entity');
const metrics={
  positive_cases:positive.length,
  negative_cases:negative.length,
  success_at_1:round(positive.filter(x=>x.rank===1).length/n),
  success_at_3:round(positive.filter(x=>x.rank&&x.rank<=3).length/n),
  success_at_5:round(positive.filter(x=>x.rank&&x.rank<=5).length/n),
  mrr:round(positive.reduce((s,x)=>s+(x.rank?1/x.rank:0),0)/n),
  positive_zero_result_rate:round(positive.filter(x=>x.result_count===0).length/n),
  negative_zero_result_rate:round(negative.filter(x=>x.result_count===0).length/(negative.length||1)),
  exact_entity_success_at_1:round(exact.filter(x=>x.rank===1).length/(exact.length||1))
};
const t=gold.thresholds||{};
const gates={
  exact_entity_success_at_1:metrics.exact_entity_success_at_1>=(t.exact_entity_success_at_1??1),
  overall_success_at_3:metrics.success_at_3>=(t.overall_success_at_3??.95),
  overall_success_at_5:metrics.success_at_5>=(t.overall_success_at_5??.98),
  mrr:metrics.mrr>=(t.mrr??.90),
  positive_zero_result_rate:metrics.positive_zero_result_rate<=(t.positive_zero_result_rate??0),
  negative_zero_result_rate:metrics.negative_zero_result_rate>=(t.negative_zero_result_rate??1)
};
const passed=Object.values(gates).every(Boolean)&&positive.every(x=>x.passed)&&negative.every(x=>x.passed);
const byCategory={};
for(const c of [...new Set(positive.map(x=>x.category))]){
  const rows=positive.filter(x=>x.category===c),d=rows.length||1;
  byCategory[c]={cases:rows.length,success_at_1:round(rows.filter(x=>x.rank===1).length/d),success_at_3:round(rows.filter(x=>x.rank&&x.rank<=3).length/d),success_at_5:round(rows.filter(x=>x.rank&&x.rank<=5).length/d),mrr:round(rows.reduce((s,x)=>s+(x.rank?1/x.rank:0),0)/d)};
}
const report={
  release:'1.5.0',generated_at:new Date().toISOString(),ranker_version:Ranker.VERSION,index_records:records.length,
  thresholds:t,metrics,by_category:byCategory,gates,passed,
  failed_positive:positive.filter(x=>!x.passed),failed_negative:negative.filter(x=>!x.passed),
  cases:positive,negative_cases:negative
};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(`Sukuu Search relevance v${Ranker.VERSION}`);
console.log(`Index records: ${records.length}`);
console.log(`Success@1 ${metrics.success_at_1} | @3 ${metrics.success_at_3} | @5 ${metrics.success_at_5} | MRR ${metrics.mrr}`);
console.log(`Exact entity @1 ${metrics.exact_entity_success_at_1} | Positive zero ${metrics.positive_zero_result_rate} | Negative zero ${metrics.negative_zero_result_rate}`);
console.log(`Gate: ${passed?'PASS':'FAIL'}`);
if(!passed){
  for(const f of report.failed_positive)console.log(`FAIL ${f.id}: rank=${f.rank} expected<=${f.max_rank}; top=${f.top5.map(x=>x.name).join(' | ')}`);
  for(const f of report.failed_negative)console.log(`FAIL ${f.id}: expected zero results; got ${f.result_count}`);
  process.exitCode=1;
}
