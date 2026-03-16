export default function MarkdownEditor({ value, onChange, rows = 8, placeholder = 'Write content...' }) {
  const wrap = (before, after = before) => {
    const el = document.activeElement;
    if (!el || el.tagName !== 'TEXTAREA') return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const wrapped = before + (selected || 'text') + after;
    const next = value.slice(0, start) + wrapped + value.slice(end);
    onChange(next);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + (selected.length || 4));
    });
  };

  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        <button type="button" className="btn btn-sm" onClick={() => wrap('**')} title="Bold">B</button>
        <button type="button" className="btn btn-sm italic" onClick={() => wrap('*')} title="Italic">I</button>
        <button type="button" className="btn btn-sm" onClick={() => wrap('[', '](url)')} title="Link">🔗</button>
        <button type="button" className="btn btn-sm" onClick={() => wrap('`')} title="Inline code">&lt;/&gt;</button>
        <button type="button" className="btn btn-sm" onClick={() => wrap('\n- '  , '')} title="List item">• list</button>
      </div>
      <textarea
        className="field-input field-textarea font-mono text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}
