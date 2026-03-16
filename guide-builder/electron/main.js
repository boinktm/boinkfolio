const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('node:path');
const { registerFileHandlers } = require('./file-service');
const { registerGitHandlers } = require('./git-service');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    title: 'Boinkfolio Content Manager',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5180');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  return win;
}

function getProjectRoot() {
  // guide-builder lives at boinkfolio/guide-builder/
  // project root is boinkfolio/
  if (isDev) {
    return path.resolve(__dirname, '..', '..');
  }
  // Packaged: exe is in desktop-app/electron-build/ → project root is ../../
  return path.resolve(app.getAppPath(), '..', '..', '..');
}

app.whenReady().then(() => {
  const projectRoot = getProjectRoot();

  // Register IPC handlers
  registerFileHandlers(ipcMain, projectRoot);
  registerGitHandlers(ipcMain, projectRoot);

  // Dialog handlers
  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options?.filters || [],
      defaultPath: options?.defaultPath || projectRoot,
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:openFiles', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: options?.filters || [],
      defaultPath: options?.defaultPath || projectRoot,
    });
    if (result.canceled) return null;
    return result.filePaths;
  });

  ipcMain.handle('dialog:saveFile', async (_event, options) => {
    const result = await dialog.showSaveDialog({
      filters: options?.filters || [],
      defaultPath: options?.defaultPath || projectRoot,
    });
    if (result.canceled) return null;
    return result.filePath;
  });

  ipcMain.handle('shell:openExternal', (_event, url) => {
    return shell.openExternal(url);
  });

  ipcMain.handle('app:getProjectRoot', () => projectRoot);

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
