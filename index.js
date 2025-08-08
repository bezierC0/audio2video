const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');

async function handleFolderOpen(event, title) { // Modified to accept title from ipcRenderer
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: title, // Use the title passed from the renderer process
    properties: ['openDirectory'],
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
}

async function handleImageOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'bmp', 'gif'] }],
  });
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));

  // debug tool
  //mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFolder', (event, title) => handleFolderOpen(title));
  ipcMain.handle('dialog:openImage', handleImageOpen);
  ipcMain.on('start-conversion', async (event, { inputPath, imagePath, outputPath }) => {
    if (!inputPath || !outputPath) {
      console.error('Input or output path is not defined.');
      return;
    }

    try {
      const files = await fs.readdir(inputPath);
      const audioFiles = files.filter(file => /\.(mp3|flac|wav|aac|ogg)$/i.test(file));
      const totalFiles = audioFiles.length;
      let completedFiles = 0;

      for (const file of audioFiles) {
        const inputFilePath = path.join(inputPath, file);
        const outputFileName = `${path.parse(file).name}.mp4`;
        const outputFilePath = path.join(outputPath, outputFileName);

        await new Promise((resolve, reject) => {
          ffmpeg()
            .addInput(imagePath || path.join(__dirname, 'placeholder.png'))
            .loop()
            .addInput(inputFilePath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioBitrate('192k')
            .videoBitrate('2500k')
            .size('1920x1080')
            .outputOptions('-pix_fmt yuv420p')
            .outputOptions('-shortest')
            .on('end', () => {
              completedFiles++;
              const progress = (completedFiles / totalFiles) * 100;
              event.sender.send('conversion-progress', { progress, file: outputFileName });
              resolve();
            })
            .on('error', (err) => {
              console.error(`Error converting ${file}:`, err);
              reject(err);
            })
            .save(outputFilePath);
        });
      }
      event.sender.send('conversion-complete', outputPath);
    } catch (err) {
      console.error('Error reading input directory:', err);
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
