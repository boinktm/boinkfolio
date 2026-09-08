import { describe, expect, it } from 'vitest';
import { renderMarkdown, withBaseUrl } from './renderMarkdown';

describe('save article markdown', () => {
  it('renders headings, images, and allowed video tags', () => {
    const html = renderMarkdown('# Project Breakdown\n\nCustom assets.\n\n![Wireframe](/content/media/wireframe.webp)\n\n<video src="/content/media/showcase.mp4"></video>');
    expect(html).toContain('<h1>Project Breakdown</h1>');
    expect(html).toContain(`<img alt="Wireframe" src="${withBaseUrl('/content/media/wireframe.webp')}" />`);
    expect(html).toContain(`<video src="${withBaseUrl('/content/media/showcase.mp4')}" controls></video>`);
    expect(renderMarkdown('<video src="https://evil.example/x.mp4"></video>')).toContain('evil.example');
    expect(renderMarkdown('<video src="https://evil.example/x.mp4"></video>')).not.toContain('<video src="https://evil.example');
  });

  it('prefixes stored media paths with the Vite base URL', () => {
    expect(withBaseUrl('/content/media/wireframe.webp', './')).toBe('./content/media/wireframe.webp');
    expect(withBaseUrl('/content/media/wireframe.webp', '/boinkfolio/')).toBe('/boinkfolio/content/media/wireframe.webp');
  });
});
