export default function StatusBar({ status, projectRoot }) {
  const colorClass =
    status.type === 'error' ? 'text-error' :
    status.type === 'success' ? 'text-success' :
    status.type === 'warning' ? 'text-warning' :
    'text-text-muted';

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-void text-[11px]">
      <span className={colorClass}>{status.text}</span>
      <span className="text-text-muted truncate ml-4 max-w-[400px]" title={projectRoot}>
        {projectRoot}
      </span>
    </div>
  );
}
