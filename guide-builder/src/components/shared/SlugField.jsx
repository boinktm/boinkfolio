import { useEffect, useRef } from 'react';
import { toSlug } from '../../lib/utils';

export default function SlugField({ value, onChange, sourceValue }) {
  const userEdited = useRef(false);

  useEffect(() => {
    if (!userEdited.current && sourceValue) {
      onChange(toSlug(sourceValue));
    }
  }, [sourceValue, onChange]);

  const handleChange = (e) => {
    userEdited.current = true;
    onChange(toSlug(e.target.value));
  };

  const handleReset = () => {
    userEdited.current = false;
    onChange(toSlug(sourceValue || ''));
  };

  return (
    <div className="flex gap-2 items-end">
      <input
        type="text"
        className="field-input flex-1 font-mono text-xs"
        value={value}
        onChange={handleChange}
        placeholder="auto-generated-slug"
      />
      <button type="button" className="btn btn-sm" onClick={handleReset} title="Reset to auto-generated slug">
        ↻
      </button>
    </div>
  );
}
