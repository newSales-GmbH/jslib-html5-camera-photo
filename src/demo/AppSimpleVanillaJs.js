import CameraPhoto, { FACING_MODES, IMAGE_TYPES } from '../lib';
import './styles.css';

// get video and image elements
let videoElement = document.getElementById('videoId');
let imgElement = document.getElementById('imgId');

// get select and buttons elements
let facingModeSelectElement =
    document.getElementById('facingModeSelectId');
let startCameraDefaultAllButtonElement =
    document.getElementById('startDefaultAllButtonId');
let startDefaultResolutionButtonElement =
    document.getElementById('startDefaultResolutionButtonId');
let startMaxResolutionButtonElement =
    document.getElementById('startMaxResolutionId');
let takePhotoButtonElement =
    document.getElementById('takePhotoButtonId');
let stopCameraButtonElement =
    document.getElementById('stopCameraButtonId');
let cameraSettingElement =
    document.getElementById('cameraSettingsId');
let showInputVideoDeviceInfosButtonElement =
  document.getElementById('showInputVideoDeviceInfosButtonId');
let inputVideoDeviceInfosElement =
    document.getElementById('inputVideoDeviceInfosId');

// instantiate CameraPhoto with the videoElement
let cameraPhoto = new CameraPhoto(videoElement);

function startCameraDefaultAll () {
  cameraPhoto.startCamera()
    .then(() => {
      console.log(`Camera started with default All`);
    })
    .catch((error) => {
      console.error('Camera not started!', error);
    });
}

// start the camera with prefered environment facingMode ie. ()
// if the environment facingMode is not avalible, it will fallback
// to the default camera avalible.
function startCameraDefaultResolution () {
  let facingMode = facingModeSelectElement.value;
  cameraPhoto.startCamera(FACING_MODES[facingMode])
    .then(() => {
      console.log(`Camera started with default resolution and ` +
        `prefered facingMode : ${facingMode}`);
    })
    .catch((error) => {
      console.error('Camera not started!', error);
    });
}

// function called by the buttons.
async function takePhoto () {
  let sizeFactor = 1;
  let imageType = IMAGE_TYPES.JPG;
  let imageCompression = 1;

  let config = {
    sizeFactor,
    imageType,
    imageCompression
  };

  // debugger; // eslint-disable-line no-debugger
  // console.log(await cameraPhoto.getDataBlob(config));

  imgElement.src = cameraPhoto.getDataUri(config);
}

function showCameraSettings () {
  let settings = cameraPhoto.getCameraSettings();

  // by default is no camera...
  let innerHTML = 'No camera';
  if (settings) {
    let {aspectRatio, deviceId, frameRate, height, width} = settings;
    innerHTML = `
        aspectRatio:${aspectRatio}
        frameRate: ${frameRate}
        height: ${height}
        width: ${width},
        deviceId: ${deviceId}
    `;
  }
  cameraSettingElement.innerHTML = innerHTML;
}

function showInputVideoDeviceInfos () {
  let inputVideoDeviceInfos = cameraPhoto.getInputVideoDeviceInfos();

  // by default is no inputVideoDeviceInfo...
  let innerHTML = 'No inputVideoDeviceInfo';
  if (inputVideoDeviceInfos) {
    innerHTML = '';
    inputVideoDeviceInfos.forEach((inputVideoDeviceInfo) => {
      let {kind, label, deviceId} = inputVideoDeviceInfo;
      let inputVideoDeviceInfoHTML = `
            kind: ${kind}
            label: ${label}
            deviceId: ${deviceId}
            <button class="selectDeviceButton" data-device-id="${deviceId}" data-res="default">switch (default)</button>
            <button class="selectDeviceButton" data-device-id="${deviceId}" data-res="max">switch (max)</button>
            <br/>
        `;
      innerHTML += inputVideoDeviceInfoHTML;
    });
  }
  inputVideoDeviceInfosElement.innerHTML = innerHTML;
}

function stopCamera () {
  cameraPhoto.stopCamera()
    .then(() => {
      console.log('Camera stoped!');
    })
    .catch((error) => {
      console.log('No camera to stop!:', error);
    });
}

function startCameraMaxResolution () {
  let facingMode = facingModeSelectElement.value;
  cameraPhoto.startCameraMaxResolution(FACING_MODES[facingMode])
    .then(() => {
      let log =
          `Camera started with maximum resoluton and ` +
          `prefered facingMode : ${facingMode}`;
      console.log(log);
    })
    .catch((error) => {
      console.error('Camera not started!', error);
    });
}

document.addEventListener('DOMContentLoaded', function () {
  // update camera setting
  setInterval(() => {
    showCameraSettings();
  }, 500);

  // bind the buttons to the right functions.
  startCameraDefaultAllButtonElement.onclick = startCameraDefaultAll;
  startDefaultResolutionButtonElement.onclick = startCameraDefaultResolution;
  startMaxResolutionButtonElement.onclick = startCameraMaxResolution;
  takePhotoButtonElement.onclick = takePhoto;
  stopCameraButtonElement.onclick = stopCamera;
  showInputVideoDeviceInfosButtonElement.onclick = showInputVideoDeviceInfos;
});

document.body.addEventListener('click', function (evt) {
  if (evt.target.classList.contains('selectDeviceButton')) {
    const {res, deviceId} = evt.target.dataset;

    (function () {
      if (res === 'max') {
        return cameraPhoto.startCameraMaxResolution(undefined, deviceId);
      }

      return cameraPhoto.startCamera(undefined, undefined, deviceId);
    })()
      .then(() => {
        console.log(`Camera started with deviceId ${deviceId} res ${res}`);
      })
      .catch((error) => {
        console.error('Camera not started!', error);
      })
    ;
  }
}, false);
