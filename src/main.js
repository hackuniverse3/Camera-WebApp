const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      experimentalFeatures: true,
      forceColorProfile: 'hdr10'
    }
  });

  // Load the local HTML bundle
  win.loadFile(path.join(__dirname, '..', 'public', 'index.html'));

  // Open DevTools for debugging
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});