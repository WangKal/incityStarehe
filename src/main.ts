import {
  bootstrapCameraKit,
  CameraKitSession,
  createMediaStreamSource,
  Transform2D
} from "@snap/camera-kit";

const liveRenderTarget = document.getElementById('canvas') as HTMLCanvasElement;
const flipCamera = document.getElementById('flip');
const errorContainer = document.getElementById('error-container');

let isBackFacing = true;
let mediaStream: MediaStream;

window.onerror = function (message, source, lineno, colno) {
  appendError(`Global JS Error:\n${message}\nAt ${source}:${lineno}:${colno}`);
  return false;
};

(async function main() {
  appendError('Starting camera initialization...');
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'your-token-here'
    });

    appendError('CameraKit bootstrapped');

    const session = await cameraKit.createSession({ liveRenderTarget });
    appendError('Session created');

    const lens = await cameraKit.lensRepository.loadLens(
      '3e71b80f-6482-4916-9882-6cbeaaa7c72c',
      '63e0d189-2d1f-4e47-a7e5-8ec40b1f947b'
    );
    appendError('Lens loaded');

    await session.applyLens(lens);
    appendError('Lens applied');

    setupFlipButton(session);
    await initializeCamera(session);
    appendError('Camera initialized and playing');

  } catch (error: any) {
     let errorMessage = 'Init error: ' + (error?.message || error);
    // Check if the error has a status code (e.g., HTTP errors)
    if (error?.response?.status) {
      errorMessage += ` (Status Code: ${error.response.status})`;
    }
    appendError('Init error: ' + (errorMessage));
    console.error('Initialization error:', error);
  }
})();

function setupFlipButton(session: CameraKitSession) {
  if (!flipCamera) return;

  flipCamera.style.cursor = 'pointer';
  flipCamera.addEventListener('click', () => handleCameraFlip(session));
  updateButtonText();
  appendError('Flip button ready');
}

async function initializeCamera(session: CameraKitSession) {
  appendError('Requesting camera access...');
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    appendError('Camera access granted');

    const source = createMediaStreamSource(mediaStream, {
      transform: Transform2D.Identity
    });

    await session.setSource(source);
    await session.play();
    appendError('Camera session is playing');

  } catch (error: any) {
    appendError('Camera init error: ' + (error?.message || error));
    console.error('Camera initialization failed:', error);
    isBackFacing = true;
    updateButtonText();
  }
}

async function handleCameraFlip(session: CameraKitSession) {
  appendError('Switching camera...');
  try {
    isBackFacing = !isBackFacing;
    updateButtonText();

    if (mediaStream) {
      session.pause();
      mediaStream.getTracks().forEach(track => track.stop());
      appendError('Old media stream stopped');
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: isBackFacing ? 'environment' : 'user',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    appendError('New camera stream acquired');

    const source = createMediaStreamSource(mediaStream, {
      transform: isBackFacing ? Transform2D.Identity : Transform2D.MirrorX
    });

    await session.setSource(source);
    await session.play();
    appendError('Camera switched and playing');

  } catch (error: any) {
    appendError('Flip camera error: ' + (error?.message || error));
    console.error('Camera flip failed:', error);
    isBackFacing = !isBackFacing;
    updateButtonText();
  }
}

function updateButtonText() {
  if (flipCamera) {
    flipCamera.textContent = isBackFacing
      ? 'Switch to Front Camera'
      : 'Switch to Back Camera';
  }
}

// Helper function to append errors to the error container
function appendError(message: string) {
  if (errorContainer) {
    const errorMessage = document.createElement('div');
    errorMessage.textContent = message;
    errorContainer.appendChild(errorMessage);
    errorContainer.scrollTop = errorContainer.scrollHeight; // Scroll to bottom
  }
}
