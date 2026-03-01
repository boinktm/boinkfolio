import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Mapping Projects content collection.
 *
 * To add a new project, create a new .md file in src/content/mapping/
 * The filename becomes the URL slug (e.g.  de_my_map.md  →  /mapping/de_my_map)
 *
 * Frontmatter fields:
 *   title        – Display name
 *   game         – Game / engine (e.g. "Counter-Strike 2")
 *   tagline      – One-liner for the gallery card
 *   thumbnail    – Hero / thumbnail image URL
 *   images       – Array of screenshot URLs
 *   videos       – Array of YouTube / video embed URLs (optional)
 *   workshopUrl  – Steam Workshop link (optional)
 *   date         – Release or last-updated date (e.g. "Feb 2026")
 *   tags         – Array of category tags (e.g. ["Defuse", "5v5"])
 *   featured     – true to show as a large hero card on the gallery (optional)
 *
 * The markdown body below the frontmatter becomes the project description,
 * rendered as rich HTML on the detail page.
 */
const mapping = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/mapping' }),
  schema: z.object({
    title: z.string(),
    game: z.string(),
    tagline: z.string(),
    thumbnail: z.string(),
    images: z.array(z.string()).default([]),
    videos: z.array(z.string()).default([]),
    workshopUrl: z.string().optional(),
    date: z.string(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

const art = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/art' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    thumbnail: z.string(),
    fullres: z.string().optional(),
    images: z.array(z.string()).default([]),
    medium: z.string(),
    status: z.string(),
    date: z.string(),
    software: z.array(z.string()).default([]),
    externalUrl: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { mapping, art };
