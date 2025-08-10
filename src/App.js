import React, { useState, useEffect } from 'react';

function App() {
  const [inputPath, setInputPath] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Idle');
  const [currentFile, setCurrentFile] = useState('');
  const [isConverting, setIsConverting] = useState(false);

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
      window.electronAPI.startConversion({ inputPath, imagePath, outputPath });
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
      setStatus(`Conversion complete! Files saved in: ${path}`);
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
              {isConverting ? 'Stop Conversion' : '4. Start Conversion'}
            </button>
            <div className="tips">Tip: Use built-in placeholder if no cover is selected</div>
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

        <div className="footer">Designed for simplicity · batch convert audio to video</div>
      </div>
    </div>
  );
}

export default App;
