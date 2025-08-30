const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

// Configure bundled ffmpeg/ffprobe binaries so the app works without system installation
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

async function handleFolderOpen(title) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: title,
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
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'] }],
  });
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 760,
    height: 640,
    icon: path.join(__dirname, 'assets', 'icons', 'logo.png'),
    backgroundColor: '#ffffff',
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  // fix file path
  const htmlPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Loading HTML file from:', htmlPath);
  
  // check file exist
  if (require('fs').existsSync(htmlPath)) {
    mainWindow.loadFile(htmlPath);
  } else {
    console.error('HTML file not found at:', htmlPath);
    // backup path
    const altPath = path.join(__dirname, 'index.html');
    if (require('fs').existsSync(altPath)) {
      mainWindow.loadFile(altPath);
    } else {
      console.error('Backup HTML file also not found');
      mainWindow.loadURL('data:text/html,<h1>Error: HTML file not found</h1>');
    }
  }

  // debug tool 
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Set minimal menu: keep only File
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { role: 'quit', label: process.platform === 'darwin' ? 'Quit' : 'Exit' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const version = app.getVersion();
            dialog.showMessageBox({
              type: 'info',
              title: 'About',
              message: `Audio to Video Batch Tool\nVersion: ${version}`,
            });
          }
        },
      ],
    }
  ]);
  Menu.setApplicationMenu(menu);
  ipcMain.handle('dialog:openFolder', (event, title) => handleFolderOpen(title));
  ipcMain.handle('dialog:openImage', handleImageOpen);
  ipcMain.handle('app:getVersion', async () => app.getVersion());
  
  let currentConversion = null;
  let isConversionStopped = false;
  
  ipcMain.on('stop-conversion', (event) => {
    isConversionStopped = true;
    if (currentConversion) {
      currentConversion.kill('SIGKILL');
      currentConversion = null;
    }
    event.sender.send('conversion-stopped');
  });
  
  ipcMain.on('start-conversion', async (event, { inputPath, imagePath, outputPath, settings }) => {
    if (!inputPath || !outputPath) {
      console.error('Input or output path is not defined.');
      return;
    }

    try {
      isConversionStopped = false;
      const files = await fs.readdir(inputPath);
      const audioFiles = files.filter(file => /\.(mp3|flac|wav|aac|ogg|m4a)$/i.test(file));
      const totalFiles = audioFiles.length;
      let completedFiles = 0;

      for (const file of audioFiles) {
        // Check if conversion was stopped
        if (isConversionStopped) {
          break;
        }
        
        const inputFilePath = path.join(inputPath, file);
        const outputFileName = `${path.parse(file).name}.mp4`;
        const outputFilePath = path.join(outputPath, outputFileName);

        // Send current file info immediately when starting conversion
        event.sender.send('conversion-progress', { 
          progress: (completedFiles / totalFiles) * 100, 
          file: outputFileName,
          currentFileProgress: 'Starting...'
        });

        await new Promise((resolve, reject) => {
          const startTime = Date.now();
          let lastProgressUpdate = 0;

          const ffmpegCommand = ffmpeg()
            .addInput(imagePath || path.join(__dirname, 'data', 'cover.png'))
            .loop()
            .addInput(inputFilePath)
            .videoCodec((settings && settings.videoCodec) || 'libx264')
            .audioCodec((settings && settings.audioCodec) || 'aac')
            .videoBitrate((settings && settings.videoBitrate) || '2500k')
            .size((settings && settings.size) || '1920x1080')
            .outputOptions('-pix_fmt yuv420p')
            .outputOptions('-shortest')
            .outputOptions([`-r ${settings && settings.fps ? settings.fps : 30}`])
            .on('progress', (progress) => {
              // Check if conversion was stopped
              if (isConversionStopped) {
                ffmpegCommand.kill('SIGKILL');
                return;
              }
              
              // Update progress every 500ms to avoid too many updates
              const now = Date.now();
              if (now - lastProgressUpdate > 500) {
                const elapsed = Math.floor((now - startTime) / 1000);
                const timeStr = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}`;
                event.sender.send('conversion-progress', { 
                  progress: (completedFiles / totalFiles) * 100, 
                  file: outputFileName,
                  currentFileProgress: `Converting... ${timeStr}`
                });
                lastProgressUpdate = now;
              }
            })
            .on('end', () => {
              if (isConversionStopped) {
                reject(new Error('Conversion stopped by user'));
                return;
              }
              
              completedFiles++;
              const progress = (completedFiles / totalFiles) * 100;
              event.sender.send('conversion-progress', { 
                progress, 
                file: outputFileName,
                currentFileProgress: 'Completed'
              });
              resolve();
            })
            .on('error', (err) => {
              console.error(`Error converting ${file}:`, err);
              reject(err);
            });

          // Apply audio bitrate only when not copying audio
          if (!settings || settings.audioCodec !== 'copy') {
            ffmpegCommand.audioBitrate((settings && settings.audioBitrate) || '192k');
          }

          currentConversion = ffmpegCommand;
          ffmpegCommand.save(outputFilePath);
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
