import type { GitSettings } from '../types';

export function TokenPanel({
  settings,
  busy,
  onChange,
  onSave,
}: {
  settings: GitSettings;
  busy: boolean;
  onChange: (patch: Partial<GitSettings>) => void;
  onSave: () => void;
}) {
  return <section className="git-settings">
    <span className="eyebrow">GITHUB ACCESS</span>
    <h3>Paste your GitHub token.</h3>
    <p>This is the only setup step. The token stays on this computer and publishes projects to your live site.</p>
    <p>On the GitHub token page, give this repo access and set <strong>Contents: Read and write</strong>. The first time the site is published, also set <strong>Workflows: Read and write</strong>.</p>
    <label>GitHub Personal Access Token<input type="password" autoComplete="off" value={settings.token} onChange={event => onChange({ token: event.target.value })} placeholder="ghp_… or github_pat_…" /></label>
    <div className="git-actions">
      <button type="button" onClick={() => void onSave()} disabled={busy || !settings.token.trim()}>Save token</button>
    </div>
  </section>;
}
