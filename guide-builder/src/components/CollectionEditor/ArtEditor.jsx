import CollectionEditor from './CollectionEditor';

export default function ArtEditor({ projectRoot, updateStatus }) {
  return <CollectionEditor collection="art" projectRoot={projectRoot} updateStatus={updateStatus} />;
}
