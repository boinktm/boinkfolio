import { useState, useCallback } from 'react';
import { FormField, TextInput, TextArea, Checkbox } from '../shared/FormField';
import TagInput from '../shared/TagInput';
import ImageBrowser from '../shared/ImageBrowser';
import SlugField from '../shared/SlugField';
import MarkdownEditor from '../shared/MarkdownEditor';
import { SCHEMAS, getDefaults, buildMarkdownFile } from '../../lib/markdown-builder';
import { parseMarkdownFile } from '../../lib/parsers';
import { toSlug, defaultDate } from '../../lib/utils';

/**
 * Generic collection editor used by Art, Assets, Mapping, Musings tabs.
 * Renders a form based on the schema, handles create/edit/clear.
 */
export default function CollectionEditor({ collection, projectRoot, updateStatus, allowAstro }) {
  const schema = SCHEMAS[collection];
  const [fields, setFields] = useState(() => {
    const d = getDefaults(collection);
    if (d.date === '') d.date = defaultDate();
    return d;
  });
  const [body, setBody] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editPath, setEditPath] = useState('');
  const [fileType, setFileType] = useState('md'); // 'md' or 'astro'

  const contentDir = `src/content/${collection}`;
  const astroDir = 'src/pages/assets-and-guides';

  const setField = useCallback((key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClear = () => {
    const d = getDefaults(collection);
    if (d.date === '') d.date = defaultDate();
    setFields(d);
    setBody('');
    setEditMode(false);
    setEditPath('');
    setFileType('md');
    updateStatus('Cleared', 'info');
  };

  const handleLoad = async () => {
    const filters = allowAstro
      ? [{ name: 'Content files', extensions: ['md', 'astro'] }]
      : [{ name: 'Markdown', extensions: ['md'] }];

    const filePath = await window.api.openFile({
      filters,
      defaultPath: editPath || undefined,
    });
    if (!filePath) return;

    try {
      const content = await window.api.readFile(filePath);
      const isAstro = filePath.endsWith('.astro');
      const ext = isAstro ? '.astro' : '.md';

      if (isAstro) {
        // Parse .astro frontmatter (same --- delimited YAML block)
        const { frontmatter, body: parsedBody } = parseMarkdownFile(content);
        const newFields = getDefaults(collection);
        newFields.slug = filePath.split(/[\\/]/).pop().replace('.astro', '');

        for (const field of schema) {
          if (frontmatter[field.key] !== undefined) {
            newFields[field.key] = frontmatter[field.key];
          }
        }

        setFields(newFields);
        setBody(parsedBody);
        setFileType('astro');
      } else {
        const { frontmatter, body: parsedBody } = parseMarkdownFile(content);
        const newFields = getDefaults(collection);
        newFields.slug = filePath.split(/[\\/]/).pop().replace('.md', '');

        for (const field of schema) {
          if (frontmatter[field.key] !== undefined) {
            newFields[field.key] = frontmatter[field.key];
          }
        }

        setFields(newFields);
        setBody(parsedBody);
        setFileType('md');
      }

      setEditMode(true);
      setEditPath(filePath);
      updateStatus(`Loaded: ${filePath}`, 'success');
    } catch (err) {
      updateStatus(`Load error: ${err.message}`, 'error');
    }
  };

  const handleSave = async () => {
    // Validate required fields
    for (const field of schema) {
      if (field.required && !fields[field.key] && fields[field.key] !== false) {
        updateStatus(`Missing required field: ${field.label}`, 'error');
        return;
      }
    }

    const slug = fields.slug || toSlug(fields.title || '');
    if (!slug) {
      updateStatus('Missing slug or title', 'error');
      return;
    }

    // Build frontmatter object (exclude slug)
    const fmFields = {};
    for (const field of schema) {
      fmFields[field.key] = fields[field.key];
    }

    const content = buildMarkdownFile(fmFields, body);
    const ext = fileType === 'astro' ? '.astro' : '.md';
    const dir = fileType === 'astro' ? astroDir : contentDir;
    const filePath = editMode && editPath ? editPath : `${dir}/${slug}${ext}`;

    try {
      const savedPath = await window.api.writeFile(filePath, content);
      setEditMode(true);
      setEditPath(savedPath);
      updateStatus(`Saved: ${savedPath}`, 'success');
    } catch (err) {
      updateStatus(`Save error: ${err.message}`, 'error');
    }
  };

  const renderField = (field) => {
    const value = fields[field.key];

    switch (field.type) {
      case 'text':
        return (
          <FormField key={field.key} label={field.label} required={field.required}>
            <TextInput value={value || ''} onChange={(v) => setField(field.key, v)} />
          </FormField>
        );
      case 'textarea':
        return (
          <FormField key={field.key} label={field.label} required={field.required}>
            <TextArea value={value || ''} onChange={(v) => setField(field.key, v)} rows={3} />
          </FormField>
        );
      case 'image':
        return (
          <FormField key={field.key} label={field.label} required={field.required}>
            <ImageBrowser value={value || ''} onChange={(v) => setField(field.key, v)} collection={collection} />
          </FormField>
        );
      case 'tags':
        return (
          <FormField key={field.key} label={field.label}>
            <TagInput value={value || []} onChange={(v) => setField(field.key, v)} />
          </FormField>
        );
      case 'checkbox':
        return (
          <Checkbox key={field.key} label={field.label} checked={!!value} onChange={(v) => setField(field.key, v)} />
        );
      default:
        return null;
    }
  };

  // Separate fields into half-width and full-width
  const halfFields = schema.filter((f) => f.type === 'text' || f.type === 'image');
  const fullFields = schema.filter((f) => f.type === 'textarea' || f.type === 'tags');
  const checkboxFields = schema.filter((f) => f.type === 'checkbox');

  return (
    <div className="max-w-4xl">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <h2 className="font-display text-lg uppercase tracking-wide flex-1">
          {editMode ? `Edit ${collection}` : `New ${collection}`}
          {editMode && fileType === 'astro' && (
            <span className="ml-2 text-[10px] font-mono text-accent align-middle">.astro</span>
          )}
        </h2>
        <button className="btn btn-sm" onClick={handleLoad}>Load</button>
        <button className="btn btn-sm" onClick={handleClear}>Clear</button>
        <button className="btn btn-accent btn-sm" onClick={handleSave}>
          {editMode ? 'Save' : 'Create'}
        </button>
      </div>

      {/* Slug */}
      <div className="mb-4">
        <FormField label="Slug (filename)">
          <SlugField
            value={fields.slug}
            onChange={(v) => setField('slug', v)}
            sourceValue={fields.title}
          />
        </FormField>
      </div>

      {/* Grid fields */}
      <div className="form-grid mb-4">
        {halfFields.map(renderField)}
      </div>

      {/* Full width fields */}
      <div className="space-y-4 mb-4">
        {fullFields.map(renderField)}
      </div>

      {/* Checkboxes */}
      {checkboxFields.length > 0 && (
        <div className="flex gap-6 mb-4">
          {checkboxFields.map(renderField)}
        </div>
      )}

      {/* Body */}
      <div>
        <FormField label="Content Body">
          <MarkdownEditor value={body} onChange={setBody} rows={10} />
        </FormField>
      </div>
    </div>
  );
}
