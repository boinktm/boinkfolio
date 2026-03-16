import CollectionEditor from './CollectionEditor';

export default function AssetEditor({ projectRoot, updateStatus }) {
  return <CollectionEditor collection="assets" projectRoot={projectRoot} updateStatus={updateStatus} />;
}
