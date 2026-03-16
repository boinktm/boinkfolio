import { useState } from 'react';

export default function TagInput({ value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [input, setInput] = useState('');

  const addTag = (raw) => {
    const tags = raw
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter((t) => t && !value.includes(t));
    if (tags.length > 0) {
      onChange([...value, ...tags]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
      setInput('');
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map((tag, i) => (
          <span key={tag + i} className="tag-pill">
            {tag}
            <button type="button" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`}>×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        className="field-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) { addTag(input); setInput(''); } }}
        placeholder={placeholder}
      />
    </div>
  );
}
