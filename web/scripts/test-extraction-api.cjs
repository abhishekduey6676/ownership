// Local HTTP-only integration check. One synthetic Gemini call; no rendering or item writes.
(async()=>{
 const { default: assert } = await import('node:assert/strict');
 const origin='http://localhost:5173';
 const session=await fetch(origin+'/api/items');assert.equal(session.status,410);
 const cookie=''; // Extraction now bootstraps its own quota identity, not item storage.
 assert.equal(session.headers.getSetCookie().length,0);
 const request=async(form,requestOrigin=origin)=>fetch(origin+'/api/extract',{method:'POST',headers:{Origin:requestOrigin,Cookie:cookie},body:form});
 const makeForm=()=>{const form=new FormData();form.set('text','SYNTHETIC: Bought Demo Audio headphones on 10 September 2026 for INR 1200.');form.set('timeZone','Asia/Kolkata');form.set('consent','yes');return form;};
 assert.equal((await request(makeForm(),'https://example.invalid')).status,403);
 const noConsent=makeForm();noConsent.delete('consent');assert.equal((await request(noConsent)).status,400);
 const bad=makeForm();bad.delete('text');bad.set('file',new Blob(['not a PDF'],{type:'application/pdf'}),'bad.pdf');assert.equal((await request(bad)).status,400);
 const result=await request(makeForm());const body=await result.json();assert.equal(result.status,200,body.error);
 assert.equal(body.provider,'gemini');assert.match(body.fields.name,/headphone/i);assert.equal(body.fields.purchaseDate,'2026-09-10');assert.equal(Number(body.fields.price),1200);assert.equal(body.fields.warrantyExpiry,'');
 console.log('PASS: fresh-session extraction API, same-origin protection, processing acknowledgment, invalid-file rejection and real text extraction. No rendering or confirmed-item writes.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
