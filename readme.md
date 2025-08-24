# audio2video

This is a simple tool to merge an audio file and a static image into a video file.

## Features

-   Combine a single audio file (e.g., MP3) and a single cover image (e.g., PNG) into one video.
-   Simple user interface for easy file selection and video generation.

## How to Use

1.  **Install Dependencies:**
    Run the following command in the project root directory to install all necessary dependencies.
    ```bash
    npm install
    ```

2.  **Run the Application:**
    Use the following command to start the application.
    ```bash
    npm start
    ```

3.  **Steps:**
    -   Open the application.
    -   Click the "Select Audio" button to choose an audio file.
    -   Click the "Select Cover" button to choose an image file.
    -   Click the "Generate Video" button to start the merging process.
    -   Wait for the process to complete. The generated video will be saved in the specified output folder.

## Input Formats

| Type | Formats | 
| --- | --- |
| Audio File | .mp3 |
|            | .flac |
|            | .wav |
|            | .aac |
|            | .ogg |
| Image File | .jpg |
|            | .png |
|            | .bmp |
|            | .gif |

## Output Format

-   **Video File:** The generated video file will be in `.mp4` format.

## License
[MIT](./LICENSE)