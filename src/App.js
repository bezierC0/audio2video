import React, { useState, useEffect } from 'react';

function App() {
  const [inputPath, setInputPath] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Idle');
  const [currentFile, setCurrentFile] = useState('');

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
      setStatus('Converting...');
      setProgress(0);
      setCurrentFile('');
      window.electronAPI.startConversion({ inputPath, imagePath, outputPath });
    } else {
      setStatus('Please select input and output folders first');
    }
  };

  useEffect(() => {
    window.electronAPI.onConversionProgress(({ progress, file }) => {
      setProgress(progress.toFixed(2));
      setCurrentFile(file);
    });

    window.electronAPI.onConversionComplete((path) => {
      setStatus(`Conversion complete! Files saved in: ${path}`);
      setProgress(100);
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Audio to Video Tool (Batch Processing)</h1>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleSelectInputFolder}>1. Select Audio Folder</button>
        {inputPath && <p style={{ wordBreak: 'break-all' }}>{inputPath}</p>}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleSelectImage}>2. Select Cover Image (Optional)</button>
        {imagePath && <img src={imagePath} alt="Cover" style={{ maxWidth: '200px', display: 'block', marginTop: '10px' }} />}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleSelectOutputFolder}>3. Select Output Folder</button>
        {outputPath && <p style={{ wordBreak: 'break-all', color: 'green' }}>{outputPath}</p>}
      </div>

      <button onClick={handleStartConversion} disabled={!inputPath || !outputPath || status === 'Converting...'}>4. Start Conversion</button>

      <div style={{ marginTop: '20px' }}>
        <h3>Status: {status}</h3>
        {(status === 'Converting...' || progress > 0) && (
          <div>
            <p>Current File: {currentFile}</p>
            <progress value={progress} max="100" style={{ width: '100%' }}></progress>
            <span>{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
