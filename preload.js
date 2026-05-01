const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getTimestamp: () => ipcRenderer.invoke('get-timestamp'),
    setTimestamp: (ts) => ipcRenderer.invoke('set-timestamp', ts),
});