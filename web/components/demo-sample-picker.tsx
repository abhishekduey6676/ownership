"use client";
import { demoSamples, type DemoSampleId } from '@/lib/demo/samples';
import { Button } from '@/components/ui/button';
import fileSamples from '@/lib/demo/file-samples.json';

export function DemoSamplePicker({ selectedId, onSelect, onChooseUpload }: {
  selectedId?: DemoSampleId; onSelect: (id: DemoSampleId) => void; onChooseUpload: () => void;
}) {
  return <section id="demo-samples" className="panel mb-6 scroll-mt-6" aria-labelledby="demo-samples-heading">
    <p className="eyebrow">TRY IT WITHOUT YOUR OWN DOCUMENTS</p>
    <h2 id="demo-samples-heading">Start with a safe example.</h2>
    <p>Start with editable text, or download an image/PDF below. All examples are fictional. Read the source, agree to processing, then select Analyze. Gemini still does the extraction.</p>
    <div className="grid gap-4 mt-5 sm:grid-cols-3">
      {demoSamples.map(sample => <div key={sample.id}>
        <Button type="button" variant={selectedId === sample.id ? 'secondary' : 'outline'}
          className="h-auto min-h-11 w-full whitespace-normal" aria-pressed={selectedId === sample.id}
          aria-describedby={'sample-' + sample.id} onClick={() => onSelect(sample.id)}>{sample.label}</Button>
        <p id={'sample-' + sample.id} className="text-sm mt-2">{sample.summary}</p>
      </div>)}
    </div>
    <div className="mt-6 border-t pt-5" aria-labelledby="file-samples-heading">
      <h3 id="file-samples-heading" className="text-lg font-semibold">Try an actual image or PDF</h3>
      <p className="text-sm">Download a sample, choose Image or PDF below, then upload the downloaded file. Downloads do not start analysis. Both formats contain the same facts.</p>
      <div className="grid gap-5 mt-4 sm:grid-cols-2">
        {fileSamples.map(sample => <div key={sample.id}>
          <h4 className="font-semibold">{sample.title}</h4>
          <p className="text-sm">{sample.summary}</p>
          <div className="flex flex-wrap gap-4 mt-3">
            {(['png', 'pdf'] as const).map(format => <a key={format} className="text-link min-h-11"
              href={'/samples/' + sample.id + '.' + format} download={sample.id + '.' + format}
              aria-label={'Download ' + sample.title.toLowerCase() + ' as ' + format.toUpperCase()}>Download {format.toUpperCase()}</a>)}
          </div>
          <p className="text-sm mt-2"><strong>During review: </strong>{sample.reviewTip}</p>
        </div>)}
      </div>
      <a href="#upload-source" className="text-link mt-4" onClick={onChooseUpload}>Go to image/PDF upload</a>
    </div>
  </section>;
}

/** Native disclosure works with keyboard and touch; essential privacy copy stays outside it. */
export function DemoWalkthrough() {
  return <details className="mt-5 rounded-xl border p-4">
    <summary className="cursor-pointer font-semibold">How this works</summary>
    <ol className="mt-3 list-decimal space-y-3 pl-5">
      <li><strong>Choose a source.</strong> Use a sample, upload an image/PDF, or describe a purchase. Selecting a sample does not send it anywhere.</li>
      <li><strong>Analyze and review.</strong> After you agree to processing, Gemini suggests fields. Compare them with the source; correct mistakes and leave unknowns blank.</li>
      <li><strong>Confirm and explore.</strong> Your reviewed item appears across this tab’s collection. Refreshing clears additions and edits.</li>
    </ol>
  </details>;
}
