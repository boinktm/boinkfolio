export interface ProjectSaveFile {
  id: string;
  title: string;
  slug: string;
  category: 'GameDev' | 'Web' | '3D Art' | 'Audio';
  sizeKB: number;
  releaseDate: string;
  iconModel: 'cube' | 'crystal' | 'disc' | 'custom';
  iconColor: string;
  summary: string;
  tags: string[];
  bannerUrl?: string;
  contentFile: string;
}
