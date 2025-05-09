const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', { getMediaDevices: () => navigator.mediaDevices });
