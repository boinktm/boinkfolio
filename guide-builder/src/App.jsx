import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import StatusBar from './components/shared/StatusBar';
import ArtEditor from './components/CollectionEditor/ArtEditor';
import AssetEditor from './components/CollectionEditor/AssetEditor';
import MappingEditor from './components/CollectionEditor/MappingEditor';
import MusingEditor from './components/CollectionEditor/MusingEditor';
import GuideBuilder from './components/GuideBuilder/GuideBuilder';
import PublishPanel from './components/PublishPanel';

const TABS = ['Art', 'Assets', 'Mapping', 'Musings', 'Guides'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Guides');
  const [status, setStatus] = useState({ text: 'Ready', type: 'info' });
  const [projectRoot, setProjectRoot] = useState('');
  const [showPublish, setShowPublish] = useState(false);

  useEffect(() => {
    if (window.api?.getProjectRoot) {
      window.api.getProjectRoot().then(setProjectRoot).catch(() => {});
    }
  }, []);

  const updateStatus = useCallback((text, type = 'info') => {
    setStatus({ text, type });
  }, []);

  const renderEditor = () => {
    const props = { projectRoot, updateStatus };
    switch (activeTab) {
      case 'Art': return <ArtEditor {...props} />;
      case 'Assets': return <AssetEditor {...props} />;
      case 'Mapping': return <MappingEditor {...props} />;
      case 'Musings': return <MusingEditor {...props} />;
      case 'Guides': return <GuideBuilder {...props} />;
      default: return null;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onPublish={() => setShowPublish(true)}
      />
      <div className="app-main">
        <div className="app-content">
          {renderEditor()}
        </div>
        <StatusBar status={status} projectRoot={projectRoot} />
      </div>
      {showPublish && (
        <PublishPanel
          projectRoot={projectRoot}
          updateStatus={updateStatus}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}
