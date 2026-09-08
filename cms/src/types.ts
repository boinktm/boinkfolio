export type Category = 'GameDev' | 'Web' | '3D Art' | 'Audio';
export type IconModel = 'cube' | 'crystal' | 'disc' | 'custom';

export interface ProjectSaveFile {
  id: string;
  title: string;
  slug: string;
  category: Category;
  sizeKB: number;
  releaseDate: string;
  iconModel: IconModel;
  iconColor: string;
  summary: string;
  tags: string[];
  bannerUrl?: string;
  contentFile: string;
}

export type MediaKind = 'image' | 'video' | 'other';

export interface StagedMedia {
  name: string;
  mime: string;
  kind: MediaKind;
  contentBase64: string;
  byteLength: number;
}

export interface GitSettings {
  token: string;
  repository: string;
  branch: string;
  localRoot: string;
}

export interface PortfolioFile {
  relativePath: string;
  contentBase64?: string;
  delete?: boolean;
}

export interface Draft {
  save: ProjectSaveFile;
  markdown: string;
  overrideSize: boolean;
  slugTouched: boolean;
}

export const CATEGORIES: readonly Category[] = ['GameDev', 'Web', '3D Art', 'Audio'];

export const ICON_MODELS: readonly { id: IconModel; label: string }[] = [
  { id: 'custom', label: 'PS2 Voxel Monolith' },
  { id: 'crystal', label: 'Crystal Tower' },
  { id: 'cube', label: 'Cube' },
  { id: 'disc', label: 'Memory Disc' },
];
