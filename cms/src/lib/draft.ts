import type { Draft, ProjectSaveFile } from '../types';

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyDraft(): Draft {
  return {
    save: {
      id: '',
      title: '',
      slug: '',
      category: 'GameDev',
      sizeKB: 64,
      releaseDate: todayDate(),
      iconModel: 'custom',
      iconColor: '#00aaff',
      summary: '',
      tags: [],
      contentFile: '',
    },
    markdown: '# Project Breakdown\n\n',
    overrideSize: false,
    slugTouched: false,
  };
}

export function draftFromSave(save: ProjectSaveFile, markdown: string): Draft {
  return { save, markdown, overrideSize: true, slugTouched: true };
}
