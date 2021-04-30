import {getImageSize, getDataUri, getDataBlob, isMinimumConstraints} from './helper';

import {
  SUPPORTED_FACING_MODES,
  FACING_MODES,
  IMAGE_TYPES,
  MINIMUM_CONSTRAINTS
} from './constants';

class MediaServices {
  static createCanvas (videoElement, sizeFactor, isImageMirror) {
    const {videoWidth, videoHeight} = videoElement;
    const {imageWidth, imageHeight} = getImageSize(videoWidth, videoHeight, sizeFactor);

    // Build the canvas size and draw the image to context from videoElement
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const context = canvas.getContext('2d');

    // Flip horizontally (like css transform: rotateY(180deg))
    if (isImageMirror) {
      context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    }

    context.drawImage(videoElement, 0, 0, imageWidth, imageHeight);

    return canvas;
  }

  static getDataUri (videoElement, config) {
    const { sizeFactor, imageType, imageCompression, isImageMirror } = config;

    const canvas = MediaServices.createCanvas(videoElement, sizeFactor, isImageMirror);

    // Get dataUri from canvas
    return getDataUri(canvas, imageType, imageCompression);
  }

  static async getDataBlob (videoElement, config) {
    const { sizeFactor, imageType, imageCompression, isImageMirror } = config;

    const canvas = MediaServices.createCanvas(videoElement, sizeFactor, isImageMirror);

    // perhaps this can be solved more elegantly
    return getDataBlob(canvas, imageType, imageCompression);
  }

  static getWindowURL () {
    return window.URL || window.webkitURL || window.mozURL || window.msURL;
  }

  /*
  Inspiration : https://github.com/jhuckaby/webcamjs/blob/master/webcam.js
  */
  static getNavigatorMediaDevices () {
    let NMDevice = null;
    let isNewAPI = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    let isOldAPI = !!(navigator.mozGetUserMedia || navigator.webkitGetUserMedia);

    if (isNewAPI) {
      NMDevice = navigator.mediaDevices;
    } else if (isOldAPI) {
      let NMDeviceOld = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
      // Setup getUserMedia, with polyfill for older browsers
      // Adapted from: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

      let polyfillGetUserMedia = {
        getUserMedia: function (constraint) {
          return new Promise(function (resolve, reject) {
            NMDeviceOld.call(navigator, constraint, resolve, reject);
          });
        }
      };

      // Overwrite getUserMedia() with the polyfill
      NMDevice = Object.assign(NMDeviceOld,
        polyfillGetUserMedia
      );
    }

    // If is no navigator.mediaDevices || navigator.mozGetUserMedia || navigator.webkitGetUserMedia
    // then is not supported so return null
    return NMDevice;
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Media_Streams_API/Constraints
  static isSupportedFacingMode () {
    // navigator.mediaDevices
    return MediaServices.getNavigatorMediaDevices().getSupportedConstraints().facingMode;
  }

  static getIdealConstraints (idealFacingMode, idealResolution, exactDeviceId) {
    // default idealConstraints
    let idealConstraints = {
      audio: false,
      video: {}
    };

    if (isMinimumConstraints(idealFacingMode, idealResolution, exactDeviceId)) {
      return MINIMUM_CONSTRAINTS;
    }

    const supports = navigator.mediaDevices.getSupportedConstraints();
    /* eslint-env browser */
    /*
    if (!supports.width || !supports.height || !supports.facingMode) {
      console.error('Constraint width height or facingMode not supported!');
      return MINIMUM_CONSTRAINTS;
    }
    */

    // If is valid facingMode
    if (idealFacingMode && supports.facingMode && SUPPORTED_FACING_MODES.includes(idealFacingMode)) {
      // idealConstraints.video.facingMode = { ideal: idealFacingMode };
      idealConstraints.video.facingMode = idealFacingMode;
    }

    if (idealResolution && supports.width && idealResolution.width) {
      idealConstraints.video.width = idealResolution.width;
    }

    if (idealResolution && supports.height && idealResolution.height) {
      idealConstraints.video.height = idealResolution.height;
    }

    if (exactDeviceId && supports.deviceId) {
      idealConstraints.video.deviceId = {exact: exactDeviceId};
    }

    return idealConstraints;
  }

  static getMaxResolutionConstraints (idealFacingMode = {}, exactDeviceId, numberOfMaxResolutionTry) {
    let constraints = MediaServices.getIdealConstraints(idealFacingMode, undefined, exactDeviceId);
    const facingMode = constraints.video.facingMode;

    const VIDEO_ADVANCED_CONSTRANTS = [
      {'width': {'min': 640}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 800}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 900}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 1024}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 1080}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 1280}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 1920}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 2560}, 'ideal': {'facingMode': facingMode}},
      {'width': {'min': 3840}, 'ideal': {'facingMode': facingMode}}
    ];

    if (numberOfMaxResolutionTry >= VIDEO_ADVANCED_CONSTRANTS.length) {
      return null;
    }

    // each number of try, we remove the last value of the array (the bigger minim width)
    constraints.video.advanced = VIDEO_ADVANCED_CONSTRANTS.slice(0, -numberOfMaxResolutionTry);

    return constraints;
  }

  static get FACING_MODES () {
    return FACING_MODES;
  }

  static get IMAGE_TYPES () {
    return IMAGE_TYPES;
  }
}

export default MediaServices;
