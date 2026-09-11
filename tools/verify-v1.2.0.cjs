"use strict";
const fs=require("fs"),crypto=require("crypto"),cp=require("child_process"),path=require("path");
function j(p){return JSON.parse(fs.readFileSync(p,"utf8"))}
function hash(p){return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex")}
function ok(c,m){if(!c){console.error("FAIL:",m);process.exitCode=1}else console.log("PASS:",m)}
function fileCount(d){let n=0;for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name===".git")continue;const p=path.join(d,e.name);n+=e.isDirectory()?fileCount(p):1;}return n;}
function locs(p){return (fs.readFileSync(p,"utf8").match(/<loc>/g)||[]).length;}
function uniqueIds(rows){const a=rows.map(x=>x.id);return a.length===new Set(a).size;}
function urlToLocal(u){try{const x=new URL(u,"https://search.sukuux.com");let p=decodeURIComponent(x.pathname).replace(/^\/+|\/+$/g,"");return p?path.join(p,"index.html"):"index.html";}catch{return null;}}

const br=j("BUILD-REPORT.json"),ev=j("RELEASE-EVIDENCE-v1.2.0.json"),dr=j("data/registry/dataset-registry.json"),wk=j(".well-known/sukuu-search.json"),ct=j("data/entities/ctvet-providers.json").records,co=j("data/entities/ctvet-programme-occurrences.json").records,cbt=j("data/entities/ctvet-cbt-approved-programmes.json").records,gr=j("data/entities/gtec-institution-source-rows.json").records,gi=j("data/entities/gtec-institutions.json").records,gp=j("data/entities/gtec-programmes.json").records,si=j("data/search/national-search-index.json").records;

ok(br.release==="1.2.0-national-expansion","build release 1.2.0");
ok(wk.version==="1.2.0","machine discovery 1.2.0");
ok(dr.catalogue_version==="1.2.0","dataset registry 1.2.0");
ok(br.files===fileCount("."),`build file count reconciles exactly: ${br.files}`);

ok(ct.length===317,"CTVET numbered providers = 317");
const ss=ct.map(x=>Number(x.attributes.source_serial));
ok(ss.every((x,i)=>x===i+1),"CTVET serial continuity 1..317");
ok(ct[0].name==="Asuansi Farm Institute","CTVET first provider control");
ok(/Wealth Creation and Social Development Skills Training Centre/i.test(ct.at(-1).name),"CTVET final provider control");
ok(ct.find(x=>x.attributes.source_serial===145).attributes.accreditation_codes_raw.includes("PO2210013"),"CTVET raw anomaly code preserved");
ok(/St\. Joseph Technical Institute/i.test(ct.find(x=>x.attributes.source_serial===249).name),"CTVET malformed-row fixture 249 normalized");
ok(co.length>=800,`CTVET continuation/programme occurrences complete-floor: ${co.length}`);
ok(cbt.length===87&&cbt.every((x,i)=>x.ordinal===i+1),"CTVET CBT taxonomy continuity 1..87");
ok(uniqueIds(ct)&&uniqueIds(co),"CTVET normalized entity IDs unique");
const ctvIds=new Set(ct.map(x=>x.id));
ok(co.every(x=>x.relationships?.some(r=>r.predicate==="offered_by"&&ctvIds.has(r.target_id))),"CTVET every occurrence resolves to a provider");
ok(co.every(x=>x.provenance?.[0]?.source_id==="ctvet"),"CTVET occurrence provenance coverage 100%");

const catFile=j("data/entities/gtec-categories.json");
const catTotal=catFile.records.reduce((s,x)=>s+x.published_count,0);
ok(catFile.records.length===15,"GTEC all 15 published categories captured");
ok(gr.length===catTotal,`GTEC category rows reconcile to live published total ${catTotal}`);
ok(gi.length>=300&&gi.length<=gr.length,`GTEC canonical institutionId population plausible: ${gi.length}`);
ok(gi.every(x=>x.identifiers.some(z=>z.scheme==="GTEC institutionId"&&/^\d+$/.test(z.value))),"GTEC every canonical institution has authority institutionId");
ok(uniqueIds(gi)&&uniqueIds(gp),"GTEC normalized entity IDs unique");
ok(gp.length>=2000,`GTEC programme completeness floor passed: ${gp.length}`);
ok(gp.every(x=>x.provenance?.[0]?.source_id==="gtec"),"GTEC programme provenance coverage 100%");
const giIds=new Set(gi.map(x=>x.id));
ok(gp.every(x=>x.relationships?.some(r=>r.predicate==="offered_by"&&giIds.has(r.target_id))),"GTEC every programme resolves to an institution");

const gds=dr.datasets.find(x=>x.id==="ghana-tertiary-institutions"),pds=dr.datasets.find(x=>x.id==="ghana-tertiary-programmes"),tds=dr.datasets.find(x=>x.id==="ghana-tvet-providers-programmes");
ok(gds?.status==="live"&&pds?.status==="live"&&tds?.status==="live","GTEC and CTVET datasets promoted live");
ok(br.metadata_live_datasets===5,"build report live dataset count = 5");
ok(br.metadata_ingestion_ready_datasets===3,"build report ingestion-ready dataset count = 3");
const metaHtml=fs.readFileSync("metadata/index.html","utf8");
ok(/Live 5<\/button>/.test(metaHtml)&&/Ingestion ready 3<\/button>/.test(metaHtml),"metadata catalogue filter counts reconciled");
ok(/<strong>5<\/strong><span>live datasets<\/span>/.test(metaHtml),"metadata catalogue live statistic reconciled");

ok(si.filter(x=>x.type==="school").length===10503,"national search contains all 10,503 canonical schools");
ok(si.filter(x=>x.type==="tertiary_institution").length===gi.length,"national search contains all GTEC institutions");
ok(si.filter(x=>x.type==="tvet_provider").length===317,"national search contains all CTVET providers");
ok(si.filter(x=>x.type==="programme").length===gp.length+co.length,"national search programme count reconciles");
ok(uniqueIds(si),"national search IDs are unique");
const searchUrls=si.map(x=>x.url);ok(searchUrls.length===new Set(searchUrls).size,"national search URLs are unique");
const missingSearch=si.map(x=>[x.url,urlToLocal(x.url)]).filter(([,p])=>!p||!fs.existsSync(p));
ok(missingSearch.length===0,"every national-search URL resolves to a generated/existing local page");

for(const p of ["discover/index.html","tertiary/index.html","tvet/index.html","programmes/index.html","sitemap-discover.xml","sitemap-tertiary.xml","sitemap-tvet.xml","sitemap-programmes.xml","README-NATIONAL-EXPANSION-v1.2.0.md","RELEASE-PAYLOAD-MANIFEST.json"])ok(fs.existsSync(p),"exists "+p);
const newSms=["sitemap-discover.xml","sitemap-tertiary.xml","sitemap-tvet.xml","sitemap-programmes.xml"];
const missingSm=[];for(const f of newSms){const txt=fs.readFileSync(f,"utf8");for(const m of txt.matchAll(/<loc>(.*?)<\/loc>/g)){const p=urlToLocal(m[1]);if(!p||!fs.existsSync(p))missingSm.push([f,m[1],p]);}}
ok(missingSm.length===0,"every new sitemap URL resolves to a local page");
const allSms=["sitemap-static.xml","sitemap-regions.xml","sitemap-districts.xml","sitemap-schools.xml","sitemap-metadata.xml",...newSms];
const sitemapTotal=allSms.filter(fs.existsSync).reduce((n,p)=>n+locs(p),0);
ok(br.sitemap_urls===sitemapTotal,`build sitemap URL count reconciles exactly: ${sitemapTotal}`);

for(const [p,v] of Object.entries(ev.normalized_hashes))ok(fs.existsSync(p)&&hash(p)===v.sha256,"normalized hash "+p);
const snaps=ev.source_observation?.source_snapshot_files||[];
ok(snaps.length>=300,`source snapshot fingerprint manifest substantial: ${snaps.length} files`);
ok(snaps.every(x=>x.path&&x.sha256&&x.bytes>0),"every source snapshot manifest entry has path/bytes/SHA-256");

try{const diff=cp.execSync('git diff --name-only',{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const bad=diff.filter(x=>/^(school|region|district)\//.test(x));ok(bad.length===0,"existing singular school/region/district profile pages untouched");}catch(e){ok(false,"git diff profile-boundary check executable");}
try{cp.execSync('git diff --check',{stdio:'pipe'});ok(true,"git diff whitespace check");}catch(e){console.error(String(e.stdout||e.message));ok(false,"git diff whitespace check");}
if(process.exitCode)console.error("\nSUKUU SEARCH v1.2.0 RELEASE VERIFICATION FAILED");else console.log("\nSUKUU SEARCH v1.2.0 RELEASE VERIFIED");
