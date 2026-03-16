import CollectionEditor from './CollectionEditor';

export default function MusingEditor({ projectRoot, updateStatus }) {
  return <CollectionEditor collection="musings" projectRoot={projectRoot} updateStatus={updateStatus} />;
}
