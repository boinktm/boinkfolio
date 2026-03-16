export function FormField({ label, required, children }) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, className = '' }) {
  return (
    <input
      type="text"
      className={`field-input ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3, className = '' }) {
  return (
    <textarea
      className={`field-input field-textarea ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
    />
  );
}

export function Checkbox({ label, checked, onChange }) {
  return (
    <div className="field-checkbox-row">
      <input
        type="checkbox"
        className="field-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
