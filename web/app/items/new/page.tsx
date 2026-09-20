"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UploadCloud, LoaderCircle, Check, Sparkles, X } from 'lucide-react';
import { OwnershipShell } from '@/components/ownership-shell';
import { useAddItem } from '@/hooks/use-add-item';
import { DemoSamplePicker, DemoWalkthrough } from '@/components/demo-sample-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Documents } from '@/components/document-viewer';
import { fieldLabels, type ItemFields } from '@/lib/mock-data';
export default function AddItem() {
 const router=useRouter();
 const {step,source,text,setText,tab,setTab,error,setError,confirmed,setConfirmed,fields,saving,createdId,selectFile,analyze,save,backToSource,fieldHint,removeSource,useSample,consent,setConsent,draft,editField,enterManually,selectedSample,startAnother}=useAddItem();
 return <OwnershipShell><div className="page-wrap narrow">
  <Link className="text-link mb-7" href="/"><ArrowLeft size={18}/> Dashboard</Link>
  <ol className="steps" aria-label="Add item progress">{['Source','Analyze','Confirm','Created'].map((s,i)=><li key={s} aria-current={['source','analyzing','review','created'].indexOf(step)===i?'step':undefined}><span>{i+1}</span>{s}</li>)}</ol>
  {step==='source'&&<><p className="eyebrow">ADD AN ITEM</p><h1>Start with what<br/>you have.</h1><p className="intro">Turn receipts and purchase notes into organized item records. AI suggests the details; you decide what gets saved for this visit.</p>
   <DemoSamplePicker selectedId={selectedSample?.id} onSelect={useSample} onChooseUpload={()=>{setTab('upload');setError('')}}/>
   <div className="flow-grid"><section id="upload-source" className="panel scroll-mt-6">
    <Tabs value={tab} onValueChange={value=>{setTab(value);setError('')}}><TabsList><TabsTrigger value="upload">Image or PDF</TabsTrigger><TabsTrigger value="text">Describe a purchase</TabsTrigger></TabsList>
     <TabsContent value="upload"><label className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();selectFile(e.dataTransfer.files[0])}}>
      <input aria-label="Choose invoice, image or PDF" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>{selectFile(e.target.files?.[0]);e.target.value=''}}/>
      <UploadCloud size={38}/><strong>Choose a file or drop it here</strong><span>JPG, PNG, WebP or PDF · 3 MB maximum</span>
     </label>
     {source&&<div className="flex items-center gap-3 mt-4"><p className="min-w-0 flex-1 break-words">{source.name}</p><Button variant="ghost" size="icon" aria-label="Remove source" onClick={removeSource}><X/></Button></div>}
     </TabsContent><TabsContent value="text"><label htmlFor="source-text">Purchase or product details</label><textarea id="source-text" className="text-source" maxLength={5000} value={text} onChange={e=>setText(e.target.value)} placeholder="I bought a smartwatch today with a six-month warranty…"/></TabsContent>
    </Tabs>
    {selectedSample&&<p className="mt-4 text-sm" role="status"><strong>{selectedSample.name} selected.</strong> You can edit the text before analysis. {selectedSample.reviewTip}</p>}
    <label className="confirm-row"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)}/> I’m using synthetic or redacted, non-sensitive content and agree to send it to Google for analysis.</label>
    {error&&<p role="alert" className="error">{error}</p>}
    <Button className="action mt-6 w-full" disabled={!consent} onClick={analyze}><Sparkles/> Analyze source</Button><Button variant="outline" className="mt-4 w-full" onClick={enterManually}>Enter details manually</Button>
   </section><aside className="panel violet"><h2>You get the final say.</h2><DemoWalkthrough/><p>Gemini reads your selected source and suggests fields for you to review. It can make mistakes or miss details.</p><p>Analysis sends your input to Google. Items, edits and sources stay in this tab’s memory until refresh; nothing is saved to our item database. Google’s data handling depends on the API account and service terms. An anonymous analysis identity and daily usage counters are retained for usage checks; they do not store your items.</p><p className="text-sm">Daily AI allowance: up to 5 attempts per browser identity and 50 across the demo. Resets at 00:00 UTC. Failed or cancelled attempts may count. Manual entry does not use this allowance.</p><p>Use the synthetic sample first. Do not submit sensitive or confidential information. Review, correct, or clear every suggested value before confirming.</p></aside></div>
  </>}
  {step==='analyzing'&&<section className="panel analysis-state" role="status" aria-live="polite"><LoaderCircle className="animate-spin" size={52}/><p className="eyebrow">READING YOUR SOURCE</p><h1>Analyzing…</h1><p>Preparing AI suggestions for your review. No item is saved yet.</p><p className="break-words">{source?.name}</p><Button variant="outline" onClick={backToSource}>Cancel analysis</Button></section>}
  {step==='review'&&<><p className="eyebrow">DRAFT DETAILS / NOT YET SAVED</p><h1>Does this<br/>look right?</h1><p className="intro">{draft?.provider === 'manual' ? 'Enter the details you know. Leave anything unknown blank.' : 'These are AI suggestions, not verified facts. Edit or clear anything before you confirm.'}</p>
   {selectedSample&&<p className="mb-4 rounded-xl border p-4"><strong>Try this during review: </strong>{selectedSample.reviewTip}</p>}
   {draft?.referenceDate&&<p className="text-sm mb-4">Relative dates use {draft.referenceDate} ({draft.timeZone}).</p>}
   {draft?.warnings?.map((warning,index)=><p className="error" role="status" key={index}>{warning}</p>)}
   <form onSubmit={save} className="flow-grid"><section className="panel"><div className="fields-grid">{(Object.keys(fieldLabels) as (keyof ItemFields)[]).map(key=><div key={key}><label htmlFor={key}>{fieldLabels[key]}{key==='name'?' *':''}</label><Input id={key} aria-describedby={key+'-hint'} disabled={saving} required={key==='name'} type={key.toLowerCase().includes('date')||key==='warrantyExpiry'?'date':key==='price'?'number':'text'} min={key==='price'?'0':undefined} step={key==='price'?'0.01':undefined} value={fields[key]} onChange={e=>editField(key,e.target.value)}/><small id={key+'-hint'}>{fieldHint(key)}</small></div>)}</div>
    <label className="confirm-row"><Checkbox disabled={saving} checked={confirmed} onCheckedChange={v=>setConfirmed(v===true)}/> I’ve reviewed these details and want to create this item.</label>
    {error&&<p role="alert" className="error">{error}</p>}<div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={saving} onClick={backToSource}>Back to source</Button><Button type="submit" disabled={!confirmed||saving} className="action"><Check/> {saving ? 'Saving…' : 'Confirm & create item'}</Button></div>
   </section><aside className="panel"><h2>Your source</h2>{source&&<Documents documents={[source]}/>}<p className="mt-5">Items and sources are available until refresh only; neither is saved to the database. AI proposals do not establish warranty eligibility.</p></aside></form></>}
  {step==='created'&&<section className="panel analysis-state lime" role="status"><Check size={48}/><p className="eyebrow">CONFIRMED BY YOU</p><h1>Item created.</h1><p>{fields.name} is now in your collection for this visit.</p><p>Refreshing clears your added items and edits, and restores the samples.</p><Button className="action" onClick={()=>router.push('/items/'+createdId)}>View item details</Button><Button type="button" variant="outline" disabled={saving} onClick={startAnother}>Try another input</Button><Link className="text-link" href="/">Back to dashboard</Link></section>}
 </div></OwnershipShell>;
}
