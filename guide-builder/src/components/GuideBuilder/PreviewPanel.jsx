import { useEffect, useRef, useMemo } from 'react';
import { renderPreviewHTML } from '../../lib/preview-renderer';

export default function PreviewPanel({ meta, sections }) {
  const iframeRef = useRef(null);

  const html = useMemo(
    () => renderPreviewHTML(meta, sections, ''),
    [meta, sections]
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  return (
    <div className="h-full flex flex-col rounded-sm overflow-hidden border border-border">
      <div className="flex items-center justify-between px-3 py-1.5 bg-void border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Live Preview</span>
        <span className="text-[10px] text-text-muted">{sections.length} sections</span>
      </div>
      <iframe
        ref={iframeRef}
        className="flex-1 w-full bg-obsidian"
        sandbox="allow-scripts allow-same-origin"
        title="Guide Preview"
      />
    </div>
  );
}
