import type { ChangeEvent, DragEvent, RefObject } from 'react';
import { CATEGORIES, ICON_MODELS, type Draft, type IconModel, type Category } from '../types';

export function SaveEditor({
  draft,
  previewHtml,
  textareaRef,
  dragging,
  onTitle,
  onField,
  onMarkdown,
  onFiles,
  onDrag,
}: {
  draft: Draft;
  previewHtml: string;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  dragging: boolean;
  onTitle: (title: string) => void;
  onField: (patch: Partial<Draft['save']> & { overrideSize?: boolean; slugTouched?: boolean }) => void;
  onMarkdown: (markdown: string) => void;
  onFiles: (files: FileList | File[]) => void;
  onDrag: (dragging: boolean) => void;
}) {
  const { save } = draft;
  function drop(event: DragEvent) {
    event.preventDefault();
    onDrag(false);
    if (event.dataTransfer.files.length) onFiles(event.dataTransfer.files);
  }
  function tags(event: ChangeEvent<HTMLInputElement>) {
    onField({ tags: event.target.value.split(',').map(tag => tag.trim()).filter(Boolean) });
  }
  return <section className="save-editor">
    <label>Project Name<input value={save.title} onChange={event => onTitle(event.target.value)} placeholder="The Viaduct Custom Map" /></label>
    <div className="field-row">
      <label>Save Icon<select value={save.iconModel} onChange={event => onField({ iconModel: event.target.value as IconModel })}>
        {ICON_MODELS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select></label>
      <label>Color<span className="color-field"><input type="color" value={save.iconColor} onChange={event => onField({ iconColor: event.target.value })} /><input value={save.iconColor} onChange={event => onField({ iconColor: event.target.value })} /></span></label>
    </div>
    <div className="field-row">
      <label>Category<select value={save.category} onChange={event => onField({ category: event.target.value as Category })}>
        {CATEGORIES.map(option => <option key={option}>{option}</option>)}
      </select></label>
      <label>Release date<input type="date" value={save.releaseDate} onChange={event => onField({ releaseDate: event.target.value })} /></label>
    </div>
    <label>Summary<textarea className="summary" value={save.summary} onChange={event => onField({ summary: event.target.value })} placeholder="Short memory-card description shown in the browser." rows={2} /></label>
    <label>Tags<input value={save.tags.join(', ')} onChange={tags} placeholder="Unreal, Niagara, Custom Map" /></label>
    <div className="split">
      <label className="pane">Article<textarea ref={textareaRef} value={draft.markdown} onChange={event => onMarkdown(event.target.value)} spellCheck={false} /></label>
      <div className="pane preview-pane">
        <span className="eyebrow">LIVE PREVIEW / LUNA CRT</span>
        <article className="preview crt" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
    </div>
    <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragEnter={event => { event.preventDefault(); onDrag(true); }} onDragOver={event => event.preventDefault()} onDragLeave={() => onDrag(false)} onDrop={drop}>
      <strong>Drop images or videos here</strong>
      <span>They are added to the article automatically, then go live when you Publish.</span>
      <input type="file" accept="image/*,video/*" multiple onChange={event => { if (event.target.files) onFiles(event.target.files); event.target.value = ''; }} />
    </div>
  </section>;
}
