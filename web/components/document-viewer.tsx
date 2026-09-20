"use client";
import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ItemDocument } from '@/lib/mock-data';
import { documentCopy } from '@/lib/document-copy';
export function Documents({ documents }: { documents: ItemDocument[] }) {
  const [selected, setSelected] = useState<ItemDocument | null>(null);
  return <><div className="space-y-3">{documents.map((doc, index) => <button type="button" key={index} className="doc-row" onClick={() => setSelected(doc)}><FileText className="shrink-0" /><span className="min-w-0 flex-1 break-words text-left">{doc.name}<small className="block text-muted-foreground">{documentCopy(doc).label}</small></span><span className="text-sm font-bold">Open</span></button>)}</div>
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected && documentCopy(selected).description}</DialogDescription>
      {selected?.text ? <pre className="whitespace-pre-wrap rounded-xl border bg-white p-5 font-sans leading-7">{selected.text}</pre> : selected?.url ? selected.mime?.startsWith('image/') ? <img src={selected.url} alt={selected.name} className="max-h-[60vh] w-full object-contain" /> : <iframe title={selected.name} src={selected.url} className="h-[55vh] w-full rounded-xl border" /> : <p>No source document is attached. Review the manually entered item details.</p>}
      {selected && (selected.url || selected.text) && <Button asChild variant="outline"><a href={selected.url || `data:text/plain;charset=utf-8,${encodeURIComponent(selected.text || '')}`} download={selected.url ? selected.name : selected.name + '.txt'}><Download /> Download document</a></Button>}
    </DialogContent></Dialog></>;
}
