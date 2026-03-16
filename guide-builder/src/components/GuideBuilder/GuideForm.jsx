import { FormField, TextInput, TextArea, Checkbox } from '../shared/FormField';
import TagInput from '../shared/TagInput';
import ImageBrowser from '../shared/ImageBrowser';
import SlugField from '../shared/SlugField';

export default function GuideForm({ meta, updateMeta }) {
  return (
    <div className="panel">
      <div className="panel-kicker">Metadata</div>
      <h3 className="panel-header">Guide Details</h3>

      <div className="space-y-3">
        <div className="form-grid">
          <FormField label="Title" required>
            <TextInput
              value={meta.title}
              onChange={(v) => updateMeta('title', v)}
              placeholder="e.g. Breath of the Wild 60 FPS Optimization"
            />
          </FormField>
          <FormField label="Slug (filename)">
            <SlugField
              value={meta.slug}
              onChange={(v) => updateMeta('slug', v)}
              sourceValue={meta.title}
            />
          </FormField>
        </div>

        <FormField label="Description" required>
          <TextArea
            value={meta.description}
            onChange={(v) => updateMeta('description', v)}
            placeholder="One-paragraph description for the hero section"
            rows={3}
          />
        </FormField>

        <div className="form-grid">
          <FormField label="Category">
            <TextInput
              value={meta.category}
              onChange={(v) => updateMeta('category', v)}
              placeholder="e.g. Gaming, Development"
            />
          </FormField>
          <FormField label="Date" required>
            <TextInput
              value={meta.date}
              onChange={(v) => updateMeta('date', v)}
              placeholder="Mar 2026"
            />
          </FormField>
        </div>

        <FormField label="Hero Image (optional)">
          <ImageBrowser
            value={meta.heroImage}
            onChange={(v) => updateMeta('heroImage', v)}
            collection="guides"
          />
        </FormField>

        <FormField label="Tags">
          <TagInput
            value={meta.tags}
            onChange={(v) => updateMeta('tags', v)}
            placeholder="Type a tag and press Enter"
          />
        </FormField>

        <Checkbox
          label="Featured guide"
          checked={meta.featured}
          onChange={(v) => updateMeta('featured', v)}
        />
      </div>
    </div>
  );
}
