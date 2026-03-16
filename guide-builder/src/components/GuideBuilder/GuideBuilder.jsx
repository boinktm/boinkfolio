import { useState, useCallback, useRef, useEffect } from 'react';
import GuideForm from './GuideForm';
import SectionManager from './SectionManager';
import PreviewPanel from './PreviewPanel';
import { buildFullGuide, buildGuideFromTemplate } from '../../lib/template-engine';
import { parseGuideAstro } from '../../lib/parsers';
import { toSlug, defaultDate } from '../../lib/utils';

const EMPTY_META = {
  title: '',
  slug: '',
  description: '',
  category: '',
  date: defaultDate(),
  heroImage: '',
  tags: [],
  featured: false,
};

export default function GuideBuilder({ projectRoot, updateStatus }) {
  const [meta, setMeta] = useState(EMPTY_META);
  const [sections, setSections] = useState([
    { id: 1, title: 'Overview', intro: '', blocks: [] },
  ]);
  const [editMode, setEditMode] = useState(false);
  const [editPath, setEditPath] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const nextId = useRef(2);

  const guidePagesDir = 'src/pages/assets-and-guides';
  const templatePath = 'src/templates/interactive-guide-template.astro';

  const updateMeta = useCallback((key, value) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClear = () => {
    setMeta({ ...EMPTY_META, date: defaultDate() });
    setSections([{ id: 1, title: 'Overview', intro: '', blocks: [] }]);
    nextId.current = 2;
    setEditMode(false);
    setEditPath('');
    updateStatus('Cleared', 'info');
  };

  const handleLoad = async () => {
    const filePath = await window.api.openFile({
      filters: [{ name: 'Astro files', extensions: ['astro'] }],
    });
    if (!filePath) return;

    try {
      const content = await window.api.readFile(filePath);
      const { meta: parsed } = parseGuideAstro(content);

      setMeta({
        title: parsed.title || '',
        slug: filePath.split(/[\\/]/).pop().replace('.astro', ''),
        description: parsed.description || '',
        category: parsed.category || '',
        date: parsed.date || defaultDate(),
        heroImage: parsed.heroImage || '',
        tags: parsed.tags || [],
        featured: parsed.featured || false,
      });

      if (parsed.sections && parsed.sections.length > 0) {
        setSections(parsed.sections.map((s, i) => ({
          id: i + 1,
          title: s.title,
          intro: '',
          blocks: [],
        })));
        nextId.current = parsed.sections.length + 1;
      }

      setEditMode(true);
      setEditPath(filePath);
      updateStatus(`Loaded: ${filePath}`, 'success');
    } catch (err) {
      updateStatus(`Load error: ${err.message}`, 'error');
    }
  };

  const handleSave = async (mode = 'full') => {
    if (!meta.title || !meta.description || !meta.date) {
      updateStatus('Title, description, and date are required.', 'error');
      return;
    }

    const slug = meta.slug || toSlug(meta.title);
    let content;

    if (mode === 'template') {
      // Token-based: read template and replace tokens
      try {
        const template = await window.api.readFile(templatePath);
        content = buildGuideFromTemplate(template, {
          ...meta,
          sections: sections.map((s) => s.title),
        });
      } catch (err) {
        updateStatus(`Template read error: ${err.message}`, 'error');
        return;
      }
    } else {
      // Full HTML generation
      content = buildFullGuide(meta, sections);
    }

    const filePath = editMode && editPath ? editPath : `${guidePagesDir}/${slug}.astro`;

    try {
      const savedPath = await window.api.writeFile(filePath, content);
      setEditMode(true);
      setEditPath(savedPath);
      updateMeta('slug', slug);
      updateStatus(`Saved: ${savedPath}`, 'success');
    } catch (err) {
      updateStatus(`Save error: ${err.message}`, 'error');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="editor-toolbar flex-shrink-0">
        <h2 className="font-display text-lg uppercase tracking-wide flex-1">
          {editMode ? 'Edit Guide' : 'New Guide'}
        </h2>
        <button
          className={`btn btn-sm ${showPreview ? 'btn-accent' : ''}`}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>
        <button className="btn btn-sm" onClick={handleLoad}>Load</button>
        <button className="btn btn-sm" onClick={handleClear}>Clear</button>
        <div className="relative group">
          <button className="btn btn-accent btn-sm" onClick={() => handleSave('full')}>
            {editMode ? 'Save' : 'Create'}
          </button>
        </div>
        <button
          className="btn btn-sm"
          onClick={() => handleSave('template')}
          title="Save using token-based template (skeleton only)"
        >
          Skeleton
        </button>
      </div>

      {/* Content area */}
      <div className={`flex-1 min-h-0 flex ${showPreview ? 'gap-4' : ''}`}>
        {/* Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} overflow-y-auto pr-2`}>
          <div className="max-w-3xl space-y-6 py-4">
            <GuideForm meta={meta} updateMeta={updateMeta} />
            <SectionManager
              sections={sections}
              setSections={setSections}
              nextId={nextId}
            />
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 min-h-0">
            <PreviewPanel meta={meta} sections={sections} />
          </div>
        )}
      </div>
    </div>
  );
}
