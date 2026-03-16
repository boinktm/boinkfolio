import { normalizeImageUrl } from '../../lib/utils';

export default function ImageBrowser({ value, onChange, collection, label = 'Browse' }) {
  const handleBrowse = async () => {
    const filePath = await window.api.openFile({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] }],
    });
    if (!filePath) return;

    // Copy to public/images/{collection}/ and return relative path
    const fileName = filePath.split(/[\\/]/).pop();
    const destRelative = `public/images/${collection}/${fileName}`;
    await window.api.copyFile(filePath, destRelative);

    const urlPath = `/images/${collection}/${fileName}`;
    onChange(urlPath);
  };

  const handleUrlInput = (e) => {
    const raw = e.target.value;
    onChange(normalizeImageUrl(raw));
  };

  return (
    <div className="flex gap-2 items-end">
      <input
        type="text"
        className="field-input flex-1"
        value={value}
        onChange={handleUrlInput}
        placeholder="/images/... or paste a URL"
      />
      <button type="button" className="btn btn-sm whitespace-nowrap" onClick={handleBrowse}>
        {label}
      </button>
    </div>
  );
}
