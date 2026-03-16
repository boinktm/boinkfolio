import SectionEditor from './SectionEditor';

export default function SectionManager({ sections, setSections, nextId }) {
  const addSection = () => {
    const id = nextId.current++;
    setSections((prev) => [...prev, { id, title: `Section ${id}`, intro: '', blocks: [] }]);
  };

  const removeSection = (id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSection = (index, direction) => {
    setSections((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateSection = (id, updates) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="panel-kicker">Content</span>
          <h3 className="font-display text-lg uppercase tracking-wide text-text-primary">
            Sections ({sections.length})
          </h3>
        </div>
        <button className="btn btn-accent btn-sm" onClick={addSection}>
          + Add Section
        </button>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={index}
            total={sections.length}
            onUpdate={(updates) => updateSection(section.id, updates)}
            onRemove={() => removeSection(section.id)}
            onMove={(dir) => moveSection(index, dir)}
          />
        ))}
      </div>

      {sections.length === 0 && (
        <div className="panel text-center py-8">
          <p className="text-text-muted text-sm">No sections yet. Click "Add Section" to start.</p>
        </div>
      )}
    </div>
  );
}
