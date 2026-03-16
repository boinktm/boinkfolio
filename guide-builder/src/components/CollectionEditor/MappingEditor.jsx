import CollectionEditor from './CollectionEditor';

export default function MappingEditor({ projectRoot, updateStatus }) {
  return <CollectionEditor collection="mapping" projectRoot={projectRoot} updateStatus={updateStatus} />;
}
