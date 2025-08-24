import React, { useState, useEffect } from 'react';

function App() {
  const [inputPath, setInputPath] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Idle');
  const [currentFile, setCurrentFile] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [settings, setSettings] = useState({
    videoCodec: 'libx264',
    audioCodec: 'aac',
    audioBitrate: '192k',
    videoBitrate: '2500k',
    size: '1920x1080',
    fps: 30,
  });

  const [appVersion, setAppVersion] = useState('');

  const handleSelectInputFolder = async () => {
    const result = await window.electronAPI.selectFolders('Select Audio Folder');
    if (result) {
      setInputPath(result);
      setStatus('Input folder selected');
    }
  };

  const handleSelectOutputFolder = async () => {
    const result = await window.electronAPI.selectFolders('Select Output Folder');
    if (result) {
      setOutputPath(result);
      setStatus('Output folder selected');
    }
  };

  const handleSelectImage = async () => {
    const result = await window.electronAPI.selectImageFile();
    if (result) {
      setImagePath(result);
    }
  };

  const handleStartConversion = () => {
    if (inputPath && outputPath) {
      setIsConverting(true);
      setStatus('Converting...');
      setProgress(0);
      setCurrentFile('');
      window.electronAPI.startConversion({ inputPath, imagePath, outputPath, settings });
    } else {
      setStatus('Please select input and output folders first');
    }
  };

  const handleStopConversion = () => {
    setIsConverting(false);
    setStatus('Conversion stopped');
    setProgress(0);
    setCurrentFile('');
    window.electronAPI.stopConversion();
  };

  useEffect(() => {
    // Restore: get app version from main process (single source from package.json)
    if (window.electronAPI && window.electronAPI.getAppVersion) {
      window.electronAPI.getAppVersion().then((v) => setAppVersion(v)).catch(() => {});
    }
    window.electronAPI.onConversionProgress(({ progress, file, currentFileProgress }) => {
      setProgress(progress.toFixed(2));
      setCurrentFile(file);
      if (currentFileProgress) {
        // Remove duplicate "Converting..." by using currentFileProgress directly
        setStatus(currentFileProgress);
      }
    });

    window.electronAPI.onConversionComplete((path) => {
      setIsConverting(false);
      setStatus(`complete!`);
      setProgress(100);
    });

    window.electronAPI.onConversionStopped(() => {
      setIsConverting(false);
      setStatus('Conversion stopped');
      setProgress(0);
      setCurrentFile('');
    });
  }, []);

  return (
    <div className="container">
      <div className="title">Audio to Video Converter</div>

      <div className="card">
        <div className="steps">
          <div>
            <button className="btn" onClick={handleSelectInputFolder} disabled={isConverting}>1. Select Audio Folder</button>
          </div>
          <div>
            {inputPath && <div className="path">{inputPath}</div>}
          </div>

          <div>
            <button className="btn" onClick={handleSelectImage} disabled={isConverting}>2. Select Cover Image (Optional)</button>
          </div>
          <div>
            {imagePath && <img className="preview" src={imagePath} alt="Cover" />}
          </div>

          <div>
            <button className="btn" onClick={handleSelectOutputFolder} disabled={isConverting}>3. Select Output Folder</button>
          </div>
          <div>
            {outputPath && <div className="path">{outputPath}</div>}
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={isConverting ? handleStopConversion : handleStartConversion}
              disabled={!inputPath || !outputPath}
            >
              {isConverting ? 'Stop' : '4. Start'}
            </button>
            <div className="tips">Tip: Use built-in placeholder if no cover is selected</div>
          </div>
          <div className="settings">
            <details open={showAdvanced} onToggle={(e) => setShowAdvanced(e.currentTarget.open)}>
              <summary>Advanced Settings (Optional)</summary>
              <div className="settings-grid">
                <label>
                  <span>Video Codec</span>
                  <select
                    disabled={isConverting}
                    value={settings.videoCodec}
                    onChange={(e) => setSettings({ ...settings, videoCodec: e.target.value })}
                  >
                    <option value="libx264">H.264 (libx264)</option>
                    <option value="libx265">H.265 (libx265)</option>
                  </select>
                </label>
                <label>
                  <span>Video Bitrate</span>
                  <select
                    disabled={isConverting}
                    value={settings.videoBitrate}
                    onChange={(e) => setSettings({ ...settings, videoBitrate: e.target.value })}
                  >
                    <option value="1500k">1500k</option>
                    <option value="2500k">2500k</option>
                    <option value="4000k">4000k</option>
                    <option value="8000k">8000k</option>
                  </select>
                </label>
                <label>
                  <span>Resolution</span>
                  <select
                    disabled={isConverting}
                    value={settings.size}
                    onChange={(e) => setSettings({ ...settings, size: e.target.value })}
                  >
                    <option value="1920x1080">1920x1080</option>
                    <option value="1280x720">1280x720</option>
                    <option value="1080x1080">1080x1080</option>
                    <option value="2560x1440">2560x1440</option>
                  </select>
                </label>
                <label>
                  <span>FPS</span>
                  <select
                    disabled={isConverting}
                    value={settings.fps}
                    onChange={(e) => setSettings({ ...settings, fps: Number(e.target.value) })}
                  >
                    <option value={24}>24</option>
                    <option value={25}>25</option>
                    <option value={30}>30</option>
                    <option value={60}>60</option>
                  </select>
                </label>
                <label>
                  <span>Audio Codec</span>
                  <select
                    disabled={isConverting}
                    value={settings.audioCodec}
                    onChange={(e) => setSettings({ ...settings, audioCodec: e.target.value })}
                  >
                    <option value="aac">AAC</option>
                    <option value="libmp3lame">MP3 (libmp3lame)</option>
                    <option value="flac">FLAC</option>
                    <option value="copy">Copy (no re-encode)</option>
                  </select>
                </label>
                <label>
                  <span>Audio Bitrate</span>
                  <input
                    disabled={isConverting || settings.audioCodec === 'copy'}
                    type="text"
                    value={settings.audioBitrate}
                    onChange={(e) => setSettings({ ...settings, audioBitrate: e.target.value })}
                    placeholder="e.g. 192k"
                  />
                </label>
              </div>
            </details>
          </div>
        </div>

        <div className="status">
          <h3>Status: {status}</h3>
          {(status.includes('Converting') || progress > 0) && (
            <div>
              <div className="path">Current File: {currentFile || '-'}</div>
              <progress value={progress} max="100"></progress>
              <div className="path">Overall Progress: {progress}%</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
