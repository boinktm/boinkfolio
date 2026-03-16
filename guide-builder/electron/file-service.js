const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');

function registerFileHandlers(ipcMain, projectRoot) {
  const resolve = (filePath) => {
    // If relative, resolve from project root
    if (!path.isAbsolute(filePath)) {
      return path.join(projectRoot, filePath);
    }
    return filePath;
  };

  ipcMain.handle('fs:readFile', async (_event, filePath) => {
    const fullPath = resolve(filePath);
    return fsp.readFile(fullPath, 'utf-8');
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath, content) => {
    const fullPath = resolve(filePath);
    const dir = path.dirname(fullPath);
    await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(fullPath, content, 'utf-8');
    return fullPath;
  });

  ipcMain.handle('fs:listDir', async (_event, dirPath) => {
    const fullPath = resolve(dirPath);
    try {
      const entries = await fsp.readdir(fullPath, { withFileTypes: true });
      return entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(fullPath, entry.name),
      }));
    } catch {
      return [];
    }
  });

  ipcMain.handle('fs:copyFile', async (_event, src, dest) => {
    const fullSrc = resolve(src);
    const fullDest = resolve(dest);
    const dir = path.dirname(fullDest);
    await fsp.mkdir(dir, { recursive: true });
    await fsp.copyFile(fullSrc, fullDest);
    return fullDest;
  });

  ipcMain.handle('fs:exists', async (_event, filePath) => {
    const fullPath = resolve(filePath);
    try {
      await fsp.access(fullPath);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('fs:mkdir', async (_event, dirPath) => {
    const fullPath = resolve(dirPath);
    await fsp.mkdir(fullPath, { recursive: true });
    return fullPath;
  });
}

module.exports = { registerFileHandlers };
