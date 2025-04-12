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
  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzQ0Mzk0NzcyLCJzdWIiOiJkYzMxOTgwMS04YWNlLTRkNmEtYjQ1Yy1hN2FjMjU1ZWUzMmF-U1RBR0lOR343ZjU3NDI2Yy04NmMyLTRiMGEtYjJjNi01YmVkNTMxNmRiNTIifQ.NCLoY8XFI56yF1Ettb7jqEAJ99WEnrw44YQQh6gbhC8'
  , });

    const session = await cameraKit.createSession({ liveRenderTarget });
    
    // Load and apply lens
    const lens = await cameraKit.lensRepository.loadLens(
      '3e71b80f-6482-4916-9882-6cbeaaa7c72c',
    '63e0d189-2d1f-4e47-a7e5-8ec40b1f947b'
    );
    await session.applyLens(lens);
appendError('Lens applied');
    setupFlipButton(session);
    await initializeCamera(session);
    appendError('Camera initialized and playing');

  } catch (error) {

     let errorMessage = 'Init error: ' + (error?.message || error);
    // Check if the error has a status code (e.g., HTTP errors)
    if (error?.response?.status) {
      errorMessage += ` (Status Code: ${error.response.status})`;
    }
    appendError('Init error: ' + (errorMessage));
    console.error('Initialization error:', error);
    alert('Failed to initialize camera. Please check permissions and try again.');
  }
})();

function setupFlipButton(session: CameraKitSession) {
  if (!flipCamera) return;
  
  flipCamera.style.cursor = 'pointer';
  flipCamera.addEventListener('click', () => handleCameraFlip(session));
  updateButtonText();
}

async function initializeCamera(session: CameraKitSession) {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    const source = createMediaStreamSource(mediaStream, {
      transform: Transform2D.Identity
    });

    await session.setSource(source);
    await session.play();

  } catch (error) {
    console.error('Camera initialization failed:', error);
    isBackFacing = true;
    updateButtonText();
  }
}

async function handleCameraFlip(session: CameraKitSession) {
  try {
    isBackFacing = !isBackFacing;
    updateButtonText();

    if (mediaStream) {
      session.pause();
      mediaStream.getTracks().forEach(track => track.stop());
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: isBackFacing ? 'environment' : 'user',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    const source = createMediaStreamSource(mediaStream, {
      transform: isBackFacing ? Transform2D.Identity : Transform2D.MirrorX
    });

    await session.setSource(source);
    await session.play();

  } catch (error) {
    console.error('Camera flip failed:', error);
    isBackFacing = !isBackFacing;
    updateButtonText();
    alert('Failed to switch cameras. Please try again.');
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