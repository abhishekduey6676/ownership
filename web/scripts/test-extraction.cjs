// No browser, DOM, rendering, screenshots, or provider calls unless --live is supplied.
/* eslint-disable @typescript-eslint/no-require-imports -- Node-only test harness loads TypeScript without a new dependency. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const originalLoad = Module._load;
Module._load = function(name, ...args) { if(name === 'server-only') return {}; return originalLoad.call(this, name, ...args); };
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText, file);
const {validateDraft,deriveWarrantyExpiry,validFileSignature,factKeys,referenceDateFor}=require('../lib/ai/validation.ts');
const {reserveExtraction}=require('../lib/ai/local-limits.ts');
const {extractWithGemini}=require('../lib/ai/gemini.ts');
const base=()=>({fields:Object.fromEntries(factKeys.map(k=>[k,{value:'',evidence:'',confidence:'unknown'}])),currency:'',relativePurchaseDate:'none',warnings:[]});
(async()=>{
 const raw=base();raw.fields.name={value:'Smartwatch',evidence:'smartwatch',confidence:'high'};
 raw.fields.purchaseDate={value:'2020-01-01',evidence:'today',confidence:'high'};raw.relativePurchaseDate='today';
 raw.fields.warranty={value:'6 months',evidence:'six month warranty',confidence:'high'};
 let result=validateDraft(raw,'2026-09-15','Asia/Calcutta');
 assert.equal(result.fields.purchaseDate,'2026-09-15');assert.equal(result.fields.warrantyExpiry,'2027-03-14');assert(result.facts.warrantyExpiry.derived);
 assert.equal(result.fields.serial,'');assert.equal(result.fields.price,'');
 raw.fields.price={value:'99',evidence:'USD 99',confidence:'high'};raw.currency='USD';
 assert.equal(validateDraft(raw,'2026-09-15','UTC').fields.price,'');
 raw.currency='INR';raw.fields.price.value='0';assert.equal(validateDraft(raw,'2026-09-15','UTC').fields.price,'0');
 raw.fields.serial={value:'invented',evidence:'',confidence:'high'};assert.equal(validateDraft(raw,'2026-09-15','UTC').fields.serial,'');
 raw.fields.warrantyExpiry={value:'2028-01-01',evidence:'expiry 1 Jan 2028',confidence:'high'};
 assert.equal(validateDraft(raw,'2026-09-15','UTC').fields.warrantyExpiry,'2028-01-01');
 assert.equal(deriveWarrantyExpiry('2024-01-31','1 month'),'2024-02-28');
 assert.equal(deriveWarrantyExpiry('2026-02-30','1 month'),'');assert.equal(deriveWarrantyExpiry('2026-01-01','unknown'),'');
 assert.equal(referenceDateFor('Asia/Kolkata',new Date('2026-09-14T20:00:00Z')),'2026-09-15');
 assert.throws(()=>validateDraft({...raw,unexpected:'injected'},'2026-09-15','UTC'));
 assert.throws(()=>validateDraft({fields:{}},'2026-09-15','UTC'));
 assert(!validFileSignature(Buffer.from('not a pdf'),'application/pdf'));
 assert(validFileSignature(Buffer.from('%PDF-1.4'),'application/pdf'));
 const release=reserveExtraction('unit');assert.throws(()=>reserveExtraction('unit'));release();
 const originalFetch=global.fetch; const originalKey=process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY='synthetic-test-key';
 try {
  global.fetch=async(url,options)=>{assert(!String(url).includes('synthetic-test-key'));assert.equal(options.headers['x-goog-api-key'],'synthetic-test-key');return new Response('',{status:429});};
  await assert.rejects(()=>extractWithGemini({text:'test',referenceDate:'2026-09-15',timeZone:'UTC'}),/quota/);
  global.fetch=async()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"malformed":true}'}]}}]}));
  await assert.rejects(()=>extractWithGemini({text:'test',referenceDate:'2026-09-15',timeZone:'UTC'}),/invalid details/);
 }finally{global.fetch=originalFetch;if(originalKey)process.env.GEMINI_API_KEY=originalKey;else delete process.env.GEMINI_API_KEY;}
 console.log('PASS: validation, unknowns, currencies, relative dates, deterministic expiry, file signatures, concurrency, safe provider errors.');
 if(!process.argv.includes('--live'))return;
 const referenceDate='2026-09-15',timeZone='Asia/Kolkata';
 result=await extractWithGemini({text:'SYNTHETIC TEST: I bought a smartwatch today with a six month warranty. No price, brand, serial number or location was provided.',referenceDate,timeZone});
 assert.match(result.fields.name,/watch/i);assert.equal(result.fields.purchaseDate,referenceDate);assert.equal(result.fields.warrantyExpiry,'2027-03-14');assert.equal(result.fields.serial,'');assert.equal(result.fields.price,'');
 console.log('PASS: live text extraction and reviewable warranty calculation.');
 // Minimal synthetic text PDF assembled as bytes; no rendering involved.
 const stream='BT /F1 14 Tf 30 700 Td (SYNTHETIC INVOICE - Demo headphones) Tj 0 -24 Td (Retailer: Example Shop) Tj 0 -24 Td (Price: INR 1200.00) Tj 0 -24 Td (Purchase date: 2026-09-10) Tj ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
 let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 result=await extractWithGemini({bytes:Buffer.from(pdf),mime:'application/pdf',referenceDate,timeZone});
 assert.match(result.fields.name,/headphone/i);assert.equal(Number(result.fields.price),1200);assert.equal(result.fields.warrantyExpiry,'');assert.equal(result.fields.serial,'');
 console.log('PASS: live PDF field mapping, missing warranty and serial.');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7KsAAAAASUVORK5CYII=','base64');
 result=await extractWithGemini({bytes:png,mime:'image/png',referenceDate,timeZone});
 assert.equal(result.fields.name,'');assert.equal(result.fields.price,'');assert.equal(result.fields.warrantyExpiry,'');
 console.log('PASS: live blank-image abstention. No original files written or rendered.');
})().catch(error=>{console.error(error.message);process.exitCode=1});
