const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectAudioFiles: () => ipcRenderer.invoke('dialog:openFile'),
  selectFolders: (title) => ipcRenderer.invoke('dialog:openFolder', title),
  selectImageFile: () => ipcRenderer.invoke('dialog:openImage'),
  selectOutputPath: (metadata) => ipcRenderer.invoke('dialog:saveFile', metadata),
  startConversion: (args) => ipcRenderer.send('start-conversion', args),
  stopConversion: () => ipcRenderer.send('stop-conversion'),
  onConversionProgress: (callback) => ipcRenderer.on('conversion-progress', (_event, value) => callback(value)),
  onConversionComplete: (callback) => ipcRenderer.on('conversion-complete', (_event, value) => callback(value)),
  onConversionStopped: (callback) => ipcRenderer.on('conversion-stopped', (_event, value) => callback(value)),
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
});
