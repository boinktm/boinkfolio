const TAB_ICONS = {
  Art: '🎨',
  Assets: '📦',
  Mapping: '🗺️',
  Musings: '✍️',
  Guides: '📖',
};

export default function Sidebar({ tabs, activeTab, onTabChange, onPublish }) {
  return (
    <aside className="flex flex-col h-full bg-void border-r border-border">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center text-xs font-bold text-accent font-display">
            BB
          </div>
          <div>
            <p className="text-sm font-display uppercase tracking-wide text-text-primary">Content Manager</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest">Boinkfolio</p>
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-bold px-3 pb-2">Collections</p>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs uppercase tracking-wider rounded-sm transition-all duration-200
              ${activeTab === tab
                ? 'text-white bg-accent/15 border border-accent shadow-[inset_3px_0_0_var(--color-accent)]'
                : 'text-text-secondary border border-transparent hover:text-text-primary hover:border-border-light hover:bg-white/[0.02]'
              }`}
          >
            <span className="text-sm">{TAB_ICONS[tab]}</span>
            {tab}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-border space-y-2">
        <button onClick={onPublish} className="btn btn-accent w-full justify-center text-xs">
          Push Update
        </button>
      </div>
    </aside>
  );
}
