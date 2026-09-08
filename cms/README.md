# Memory Card Manager

Desktop app for adding projects to the Memory System site. It publishes through GitHub without local `git` commands.

## Run

Rust stable and Node 22+ are required. From this folder:

```sh
npm install
npm test
npm run tauri dev
```

`npm run dev` opens the UI in a browser for layout work. **Publish** needs `npm run tauri dev` so it can save files next to this app.

## Everyday use

1. Paste a GitHub Personal Access Token with `repo` scope the first time (already saved if you did this before).
2. Fill in the project name and article, drop images or videos.
3. Click **Publish**.

The live site updates at https://boinktm.github.io/boinkfolio/ in about a minute. Repository, branch, and folder are set automatically (`boinktm/boinkfolio`, `main`, and this portfolio folder). The token stays on this computer.

## What Publish writes

- `public/content/projects.json` — save registry
- `public/content/posts/{slug}.md` — article body
- `public/content/media/` — dropped images and videos

Virtual size is calculated automatically: 64 KB base, 50 characters per KB of markdown, 256 KB per image, 1024 KB per video, rounded to 32 KB steps and clamped to 4096 KB.
