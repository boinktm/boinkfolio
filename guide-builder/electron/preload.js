const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // File system
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  listDir: (dirPath) => ipcRenderer.invoke('fs:listDir', dirPath),
  copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),
  exists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
  mkdir: (dirPath) => ipcRenderer.invoke('fs:mkdir', dirPath),

  // Dialogs
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  openFiles: (options) => ipcRenderer.invoke('dialog:openFiles', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),

  // Git
  gitStatus: () => ipcRenderer.invoke('git:status'),
  gitCommitAndPush: (message, dryRun) => ipcRenderer.invoke('git:commitAndPush', message, dryRun),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // App
  getProjectRoot: () => ipcRenderer.invoke('app:getProjectRoot'),
});
