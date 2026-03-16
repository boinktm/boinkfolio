import { useState, useEffect, useCallback } from 'react';

export default function PublishPanel({ onClose, updateStatus }) {
  const [message, setMessage] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [gitFiles, setGitFiles] = useState([]);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    window.api.gitStatus()
      .then((res) => setGitFiles(res?.files ?? []))
      .catch(() => setGitFiles([]));
  }, []);

  const handlePush = useCallback(async () => {
    setPushing(true);
    setResult(null);
    try {
      const res = await window.api.gitCommitAndPush(message || undefined, dryRun);
      setResult({ ok: res.success, text: res.log ? res.log.join('\n') : res.message });
      if (!dryRun && res.success) updateStatus('Push complete', 'success');
    } catch (err) {
      setResult({ ok: false, text: String(err) });
      updateStatus('Push failed', 'error');
    } finally {
      setPushing(false);
    }
  }, [message, dryRun, updateStatus]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 520 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-accent tracking-wider uppercase">Push Update</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg leading-none">&times;</button>
        </div>

        {/* Changed files */}
        <div className="mb-4">
          <label className="field-label">Changed Files ({gitFiles.length})</label>
          <div className="bg-void rounded-sm border border-border max-h-36 overflow-y-auto text-xs font-mono p-2">
            {gitFiles.length === 0 && <span className="text-text-muted">No changes detected</span>}
            {gitFiles.map((f, i) => (
              <div key={i} className="py-0.5 text-text-secondary">{f}</div>
            ))}
          </div>
        </div>

        {/* Commit message */}
        <div className="mb-4">
          <label className="field-label">Commit Message (optional)</label>
          <input
            type="text"
            className="field-input"
            placeholder="Update content — YYYY-MM-DD HH:MM"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Dry run toggle */}
        <label className="flex items-center gap-2 mb-4 cursor-pointer text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="accent-accent"
          />
          Dry Run (preview only, no actual push)
        </label>

        {/* Result */}
        {result && (
          <pre className={`text-xs p-3 rounded-sm mb-4 overflow-auto max-h-40 border border-border ${result.ok ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            {result.text}
          </pre>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn">Cancel</button>
          <button
            onClick={handlePush}
            disabled={pushing || gitFiles.length === 0}
            className="btn bg-accent text-white hover:brightness-110 disabled:opacity-40"
          >
            {pushing ? 'Pushing…' : dryRun ? 'Dry Run' : 'Commit & Push'}
          </button>
        </div>
      </div>
    </div>
  );
}
