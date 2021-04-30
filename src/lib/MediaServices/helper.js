import {
  SUPPORTED_IMAGE_TYPES,
  FORMAT_TYPES,
  IMAGE_TYPES
} from './constants';
import {DEFAULT_IMAGE_COMPRESSION, DEFAULT_IMAGE_TYPE} from '../constants';

function _validateImgParam (imageType, imageCompression) {
  // validate the imageCompression
  if (imageCompression < 0 || imageCompression > 1) {
    throw new Error(imageCompression + ' is invalid imageCompression, choose between: [0, 1]');
  }

  // validate the imageType
  if (!SUPPORTED_IMAGE_TYPES.includes(imageType)) {
    throw new Error(imageType + ' is invalid imageType, choose between: ' + SUPPORTED_IMAGE_TYPES.join(', '));
  }
  return true;
}

/**
 * @param {string} imageType
 * @param {number|null} imageCompression
 * @return {{imageType: string, imageCompression: number|null}}
 */
function _getValidImgParam (imageType, imageCompression) {
  const imgParam = {
    imageType: DEFAULT_IMAGE_TYPE,
    imageCompression: DEFAULT_IMAGE_COMPRESSION
  };

  try {
    _validateImgParam(imageType, imageCompression);
    imgParam.imageType = imageType;
    imgParam.imageCompression = imageCompression;
  } catch (e) {
    console.error(e);
    console.error('default value of ' + DEFAULT_IMAGE_TYPE + ' is used');
  }

  if (imgParam.imageType === IMAGE_TYPES.PNG) {
    imgParam.imageCompression = null; // always disable on png
  }

  return imgParam;
}

export function getImageSize (videoWidth, videoHeight, sizeFactor) {
  // calc the imageWidth
  let imageWidth = videoWidth * parseFloat(sizeFactor);
  // calc the ratio
  let ratio = videoWidth / imageWidth;
  // calc the imageHeight
  let imageHeight = videoHeight / ratio;

  return {
    imageWidth,
    imageHeight
  };
}

export function getDataUri (canvas, imageType, imageCompression) {
  const imgParam = _getValidImgParam(imageType, imageCompression);

  if ((imgParam.imageType === IMAGE_TYPES.JPG) && imgParam.imageCompression) {
    return canvas.toDataURL(FORMAT_TYPES[imgParam.imageType], imgParam.imageCompression);
  }

  return canvas.toDataURL(FORMAT_TYPES[imgParam.imageType]);
}

export async function getDataBlob (canvas, imageType, imageCompression) {
  const imgParam = _getValidImgParam(imageType, imageCompression);

  return new Promise(function (resolve) {
    if (imgParam.imageCompression) {
      canvas.toBlob(resolve, FORMAT_TYPES[imgParam.imageType], imgParam.imageCompression);
    } else {
      canvas.toBlob(resolve, FORMAT_TYPES[imgParam.imageType]);
    }
  });
}

function _isEmptyObject (obj) {
  if (typeof obj === 'object') {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return false;
      }
    }
  }

  return true;
}

export function isMinimumConstraints (idealFacingMode, idealResolution, exactDeviceId) {
  return !(idealFacingMode || exactDeviceId || (idealResolution && !_isEmptyObject(idealResolution)));
}
