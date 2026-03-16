import { useState, useRef } from 'react';
import BlockEditor from './BlockEditor';

const BLOCK_TYPES = [
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'checklist', label: 'Checklist' },
  { type: 'code', label: 'Code Block' },
  { type: 'callout', label: 'Callout' },
  { type: 'ordered-list', label: 'Ordered List' },
  { type: 'unordered-list', label: 'Unordered List' },
  { type: 'chart', label: 'Chart' },
  { type: 'image', label: 'Image' },
  { type: 'card', label: 'Card' },
];

export default function SectionEditor({ section, index, total, onUpdate, onRemove, onMove }) {
  const [expanded, setExpanded] = useState(true);
  const blockId = useRef(section.blocks?.length || 0);

  const addBlock = (type) => {
    const id = ++blockId.current;
    const newBlock = createBlock(type, id);
    onUpdate({ blocks: [...(section.blocks || []), newBlock] });
  };

  const updateBlock = (blockIdx, updates) => {
    const blocks = [...(section.blocks || [])];
    blocks[blockIdx] = { ...blocks[blockIdx], ...updates };
    onUpdate({ blocks });
  };

  const removeBlock = (blockIdx) => {
    onUpdate({ blocks: (section.blocks || []).filter((_, i) => i !== blockIdx) });
  };

  const moveBlock = (blockIdx, direction) => {
    const blocks = [...(section.blocks || [])];
    const target = blockIdx + direction;
    if (target < 0 || target >= blocks.length) return;
    [blocks[blockIdx], blocks[target]] = [blocks[target], blocks[blockIdx]];
    onUpdate({ blocks });
  };

  return (
    <div className="section-block">
      <div className="section-block-header" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-xs font-mono">{expanded ? '▼' : '▶'}</span>
          <span className="text-xs text-accent font-bold uppercase tracking-widest">
            Section {index + 1}
          </span>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-b border-transparent hover:border-border-light focus:border-accent
                       text-text-primary text-sm font-display uppercase outline-none px-1 py-0.5 transition-colors"
            placeholder="Section title"
          />
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-sm"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Move up"
          >↑</button>
          <button
            className="btn btn-sm"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title="Move down"
          >↓</button>
          <button className="btn btn-sm btn-danger" onClick={onRemove} title="Remove section">×</button>
        </div>
      </div>

      {expanded && (
        <div className="section-block-body">
          {/* Intro paragraph */}
          <div className="mb-3">
            <label className="field-label">Section Intro</label>
            <textarea
              className="field-input field-textarea text-xs"
              value={section.intro || ''}
              onChange={(e) => onUpdate({ intro: e.target.value })}
              rows={2}
              placeholder="Optional introductory paragraph for this section"
            />
          </div>

          {/* Content blocks */}
          <div className="space-y-2 mb-3">
            {(section.blocks || []).map((block, blockIdx) => (
              <BlockEditor
                key={block.id}
                block={block}
                onUpdate={(updates) => updateBlock(blockIdx, updates)}
                onRemove={() => removeBlock(blockIdx)}
                onMove={(dir) => moveBlock(blockIdx, dir)}
                index={blockIdx}
                total={(section.blocks || []).length}
              />
            ))}
          </div>

          {/* Add block buttons */}
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                className="block-type-btn"
                onClick={() => addBlock(bt.type)}
              >
                + {bt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function createBlock(type, id) {
  const base = { id, type };
  switch (type) {
    case 'paragraph': return { ...base, content: '' };
    case 'checklist': return { ...base, heading: '', items: [''] };
    case 'code': return { ...base, heading: '', description: '', content: '' };
    case 'callout': return { ...base, heading: '', content: '' };
    case 'ordered-list': return { ...base, items: [''] };
    case 'unordered-list': return { ...base, items: [''] };
    case 'chart': return { ...base, canvasId: `chart-${id}`, caption: '', chartConfig: null };
    case 'image': return { ...base, src: '', alt: '', caption: '' };
    case 'card': return { ...base, heading: '', content: '' };
    default: return base;
  }
}
