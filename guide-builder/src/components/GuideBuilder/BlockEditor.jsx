/**
 * Block editor — renders the right editing UI for each block type.
 */
export default function BlockEditor({ block, onUpdate, onRemove, onMove, index, total }) {
  const typeLabel = {
    paragraph: 'Paragraph',
    checklist: 'Checklist',
    code: 'Code Block',
    callout: 'Callout',
    'ordered-list': 'Ordered List',
    'unordered-list': 'Unordered List',
    chart: 'Chart',
    image: 'Image',
    card: 'Card',
  }[block.type] || block.type;

  return (
    <div className="bg-obsidian border border-border rounded-sm">
      {/* Block header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{typeLabel}</span>
        <div className="flex items-center gap-1">
          <button className="btn btn-sm" onClick={() => onMove(-1)} disabled={index === 0} title="Move up">↑</button>
          <button className="btn btn-sm" onClick={() => onMove(1)} disabled={index === total - 1} title="Move down">↓</button>
          <button className="btn btn-sm btn-danger" onClick={onRemove} title="Remove block">×</button>
        </div>
      </div>

      {/* Block body */}
      <div className="p-3 space-y-2">
        {block.type === 'paragraph' && (
          <textarea
            className="field-input field-textarea text-xs"
            value={block.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            rows={3}
            placeholder="Paragraph text"
          />
        )}

        {block.type === 'checklist' && (
          <>
            <input
              type="text"
              className="field-input text-xs"
              value={block.heading || ''}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Checklist heading (optional)"
            />
            <ListItems
              items={block.items || []}
              onChange={(items) => onUpdate({ items })}
              placeholder="Checklist item"
            />
          </>
        )}

        {block.type === 'code' && (
          <>
            <input
              type="text"
              className="field-input text-xs"
              value={block.heading || ''}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Step heading (optional)"
            />
            <input
              type="text"
              className="field-input text-xs"
              value={block.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Description (optional)"
            />
            <textarea
              className="field-input field-textarea font-mono text-xs"
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={6}
              placeholder="Code content"
            />
          </>
        )}

        {block.type === 'callout' && (
          <>
            <input
              type="text"
              className="field-input text-xs"
              value={block.heading || ''}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Callout heading (e.g. Critical Warning)"
            />
            <textarea
              className="field-input field-textarea text-xs"
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={3}
              placeholder="Callout message"
            />
          </>
        )}

        {(block.type === 'ordered-list' || block.type === 'unordered-list') && (
          <ListItems
            items={block.items || []}
            onChange={(items) => onUpdate({ items })}
            placeholder="List item"
          />
        )}

        {block.type === 'chart' && (
          <ChartEditor block={block} onUpdate={onUpdate} />
        )}

        {block.type === 'image' && (
          <>
            <input
              type="text"
              className="field-input text-xs"
              value={block.src || ''}
              onChange={(e) => onUpdate({ src: e.target.value })}
              placeholder="Image URL or path"
            />
            <input
              type="text"
              className="field-input text-xs"
              value={block.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              placeholder="Alt text"
            />
            <input
              type="text"
              className="field-input text-xs"
              value={block.caption || ''}
              onChange={(e) => onUpdate({ caption: e.target.value })}
              placeholder="Caption (optional)"
            />
          </>
        )}

        {block.type === 'card' && (
          <>
            <input
              type="text"
              className="field-input text-xs"
              value={block.heading || ''}
              onChange={(e) => onUpdate({ heading: e.target.value })}
              placeholder="Card heading"
            />
            <textarea
              className="field-input field-textarea text-xs"
              value={block.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              rows={3}
              placeholder="Card content"
            />
          </>
        )}
      </div>
    </div>
  );
}

/** Editable list of string items with add/remove */
function ListItems({ items, onChange, placeholder }) {
  const updateItem = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const addItem = () => onChange([...items, '']);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1.5 items-center">
          <span className="text-text-muted text-[10px] font-mono w-4 text-right">{i + 1}</span>
          <input
            type="text"
            className="field-input flex-1 text-xs"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={placeholder}
          />
          <button
            className="text-text-muted hover:text-error text-xs"
            onClick={() => removeItem(i)}
            title="Remove"
          >×</button>
        </div>
      ))}
      <button className="btn btn-sm" onClick={addItem}>+ Add Item</button>
    </div>
  );
}

/** Chart configuration editor */
function ChartEditor({ block, onUpdate }) {
  const chartType = block.chartConfig?.type || 'bar';
  const labels = block.chartConfig?.data?.labels || ['Label 1', 'Label 2', 'Label 3'];
  const datasets = block.chartConfig?.data?.datasets || [
    { label: 'Dataset 1', data: [0, 0, 0], backgroundColor: '#e60012' },
  ];

  const updateConfig = (updates) => {
    const config = {
      type: chartType,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: false },
          legend: { labels: { color: '#aaaaaa' } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#aaa' }, grid: { color: 'rgba(85,85,85,0.4)' } },
          x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(85,85,85,0.2)' } },
        },
      },
      ...(block.chartConfig || {}),
      ...updates,
    };
    onUpdate({ chartConfig: config });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          className="field-input text-xs w-32"
          value={chartType}
          onChange={(e) => updateConfig({ type: e.target.value })}
        >
          <option value="bar">Bar</option>
          <option value="line">Line</option>
          <option value="pie">Pie</option>
          <option value="doughnut">Doughnut</option>
          <option value="radar">Radar</option>
        </select>
        <input
          type="text"
          className="field-input text-xs flex-1"
          value={block.canvasId || ''}
          onChange={(e) => onUpdate({ canvasId: e.target.value })}
          placeholder="Canvas ID"
        />
      </div>
      <input
        type="text"
        className="field-input text-xs"
        value={block.caption || ''}
        onChange={(e) => onUpdate({ caption: e.target.value })}
        placeholder="Chart caption"
      />
      <div>
        <label className="field-label">Labels (comma-separated)</label>
        <input
          type="text"
          className="field-input text-xs"
          value={labels.join(', ')}
          onChange={(e) => {
            const newLabels = e.target.value.split(',').map((l) => l.trim());
            updateConfig({ data: { labels: newLabels, datasets } });
          }}
        />
      </div>
      {datasets.map((ds, dsIdx) => (
        <div key={dsIdx} className="bg-charcoal p-2 rounded-sm space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              className="field-input text-xs flex-1"
              value={ds.label || ''}
              onChange={(e) => {
                const next = [...datasets];
                next[dsIdx] = { ...next[dsIdx], label: e.target.value };
                updateConfig({ data: { labels, datasets: next } });
              }}
              placeholder="Dataset label"
            />
            <input
              type="color"
              className="w-8 h-8 cursor-pointer border-none bg-transparent"
              value={ds.backgroundColor || '#e60012'}
              onChange={(e) => {
                const next = [...datasets];
                next[dsIdx] = { ...next[dsIdx], backgroundColor: e.target.value };
                updateConfig({ data: { labels, datasets: next } });
              }}
            />
          </div>
          <label className="field-label">Data (comma-separated numbers)</label>
          <input
            type="text"
            className="field-input text-xs"
            value={(ds.data || []).join(', ')}
            onChange={(e) => {
              const next = [...datasets];
              next[dsIdx] = { ...next[dsIdx], data: e.target.value.split(',').map((v) => Number(v.trim()) || 0) };
              updateConfig({ data: { labels, datasets: next } });
            }}
          />
        </div>
      ))}
      <button
        className="btn btn-sm"
        onClick={() => {
          const newDs = { label: `Dataset ${datasets.length + 1}`, data: labels.map(() => 0), backgroundColor: '#3a3a3a' };
          updateConfig({ data: { labels, datasets: [...datasets, newDs] } });
        }}
      >
        + Add Dataset
      </button>
    </div>
  );
}
