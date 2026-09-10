#!/usr/bin/env node
const fs=require('fs'); const path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const fail=m=>{console.error('FAIL:',m);process.exitCode=1};
const pass=m=>console.log('PASS:',m);
const sources=read('data/registry/source-registry.json');
const datasets=read('data/registry/dataset-registry.json');
const geo=read('data/geography/ghana-admin-index.json');
const sourceIds=new Set(sources.sources.map(x=>x.id));
if(sourceIds.size!==sources.sources.length) fail('duplicate source ids'); else pass(`${sourceIds.size} unique source ids`);
const dsIds=new Set(datasets.datasets.map(x=>x.id));
if(dsIds.size!==datasets.datasets.length) fail('duplicate dataset ids'); else pass(`${dsIds.size} unique dataset ids`);
for(const d of datasets.datasets){for(const id of d.primary_source_ids||[]) if(!sourceIds.has(id)) fail(`dataset ${d.id} references unknown source ${id}`)}
if(geo.counts.regions!==16) fail(`expected 16 regions, got ${geo.counts.regions}`); else pass('16 canonical regions');
if(geo.counts.districts!==261) fail(`expected 261 districts, got ${geo.counts.districts}`); else pass('261 canonical districts');
const pcodes=new Set();
for(const x of [...geo.regions,...geo.districts]){
  if(!x.pcode) fail(`geography record lacks canonical pcode: ${x.name}`);
  else { if(pcodes.has(x.pcode)) fail(`duplicate pcode: ${x.pcode}`); pcodes.add(x.pcode); }
}
const guan=geo.districts.find(x=>x.name==='Guan District');
if(!guan) fail('Guan District missing from geography index');
else {
  if(guan.pcode!=='GH1009' || guan.id!=='GH1009') fail(`Guan canonical code must be GH1009; found id=${guan.id} pcode=${guan.pcode}`); else pass('Guan canonical ADM2 code = GH1009');
  if(guan.source_identifier!=='osm:relation:13804589') fail(`Guan OSM provenance mismatch: ${guan.source_identifier}`); else pass('Guan OSM provenance retained separately');
}
const otiCodes=geo.districts.filter(x=>x.region==='Oti' && /^GH10\d{2}$/.test(x.pcode)).map(x=>Number(x.pcode.slice(4))).sort((a,b)=>a-b);
if(otiCodes.join(',')!=='1,2,3,4,5,6,7,8,9') fail(`Oti district sequence is not GH1001..GH1009: ${otiCodes.join(',')}`); else pass('Oti district code sequence GH1001..GH1009');
pass(`${pcodes.size} unique canonical ADM1/ADM2 geography pcodes`);
for(const p of ['metadata/index.html','metadata/sources/index.html','metadata/model/index.html','.well-known/sukuu-search.json','sitemap-metadata.xml']) if(!fs.existsSync(path.join(root,p))) fail(`missing ${p}`); else pass(`exists ${p}`);
if(!fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes('sitemap-metadata.xml')) fail('sitemap index does not reference metadata sitemap'); else pass('metadata sitemap registered');
if(!fs.readFileSync(path.join(root,'index.html'),'utf8').includes('/metadata/')) fail('root explorer lacks metadata entry point'); else pass('root explorer links metadata catalogue');
if(process.exitCode) process.exit(process.exitCode); console.log('\nNATIONAL METADATA FOUNDATION VERIFIED');
