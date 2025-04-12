import {
  bootstrapCameraKit,
  CameraKitSession,
  createMediaStreamSource,
  Transform2D
} from "@snap/camera-kit";

// Setup canvas and flip button
const liveRenderTarget = document.getElementById('canvas') as HTMLCanvasElement | null;
const flipCamera = document.getElementById('flip');

// Alert if DOM elements not found
if (!liveRenderTarget) alert('Canvas element not found.');
if (!flipCamera) alert('Flip camera button not found.');

let isBackFacing = true;
let mediaStream: MediaStream;

// Global error handlers
window.onerror = function (message, source, lineno, colno, _error) {
  alert(`JS Error:\n${message}\nSource: ${source}\nLine: ${lineno}:${colno}`);
  return false;
};

window.onunhandledrejection = function (event) {
  alert(`Unhandled Promise Rejection:\n${event.reason}`);
};

// Override console.error to alert
console.error = function (...args: any[]) {
  alert('Console Error:\n' + args.join('\n'));
};

(async function main() {
  try {
    if (!liveRenderTarget) throw new Error('Canvas element is missing.');

    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzQ0Mzk0NzcyLCJzdWIiOiJkYzMxOTgwMS04YWNlLTRkNmEtYjQ1Yy1hN2FjMjU1ZWUzMmF-U1RBR0lOR343ZjU3NDI2Yy04NmMyLTRiMGEtYjJjNi01YmVkNTMxNmRiNTIifQ.NCLoY8XFI56yF1Ettb7jqEAJ99WEnrw44YQQh6gbhC8',
    });

    const session = await cameraKit.createSession({ liveRenderTarget });

    const lens = await cameraKit.lensRepository.loadLens(
      '3e71b80f-6482-4916-9882-6cbeaaa7c72c',
      '63e0d189-2d1f-4e47-a7e5-8ec40b1f947b'
    );
    await session.applyLens(lens);

    setupFlipButton(session);
    await initializeCamera(session);

  } catch (error: any) {
    alert(`Initialization error:\n${error.message || error}`);
  }
})();

function setupFlipButton(session: CameraKitSession) {
  if (!flipCamera) {
    alert('Flip button not available.');
    return;
  }

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

  } catch (error: any) {
    alert(`Camera initialization failed:\n${error.message || error}`);
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

  } catch (error: any) {
    alert(`Camera flip failed:\n${error.message || error}`);
    isBackFacing = !isBackFacing; // revert state
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
