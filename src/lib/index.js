/* eslint-env browser */
import MediaServices from './MediaServices';

import {DEFAULT_IMAGE_COMPRESSION, DEFAULT_IMAGE_MIRROR, DEFAULT_IMAGE_TYPE, DEFAULT_SIZE_FACTOR} from './constants';

/**
 * @typedef {Object} UserConfig
 * @property {number} sizeFactor
 * @property {string} imageType png or jpg
 * @property {number|null} imageCompression
 * @property {boolean} isImageMirror
 */

class CameraPhoto {
  constructor (videoElement) {
    this.videoElement = videoElement;
    this.stream = null;
    this.numberOfMaxResolutionTry = 1;
    this.settings = null;
    this.inputVideoDeviceInfos = [];

    // Set the right object depending on the browser.
    this.windowURL = MediaServices.getWindowURL();
    this.mediaDevices = MediaServices.getNavigatorMediaDevices();
  }

  _getStreamDevice (idealFacingMode, idealResolution, exactDeviceId) {
    return new Promise((resolve, reject) => {
      let constraints =
          MediaServices.getIdealConstraints(idealFacingMode, idealResolution, exactDeviceId);

      this.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          this._gotStream(stream);
          this._getInputVideoDeviceInfosPromise()
            .then((inputVideoDeviceInfos) => {
              this.inputVideoDeviceInfos = inputVideoDeviceInfos;
            })
            .catch(() => {})
            .then(() => {
              resolve(stream);
            });
        })
        .catch((error) => {
          // let {name, constraint, message} = error;
          // window.alert(name + ' ' + constraint + ' ' + message);
          reject(error);
        });
    });
  }

  _getStreamDeviceMaxResolution (idealFacingMode, exactDeviceId) {
    const constraints =
        MediaServices.getMaxResolutionConstraints(idealFacingMode, exactDeviceId, this.numberOfMaxResolutionTry);

    // all the trying is done...
    if (constraints == null) {
      let idealResolution = {};
      return this._getStreamDevice(idealFacingMode, idealResolution, exactDeviceId);
    }

    return new Promise((resolve, reject) => {
      this.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          this._gotStream(stream);
          this._getInputVideoDeviceInfosPromise()
            .then((inputVideoDeviceInfos) => {
              this.inputVideoDeviceInfos = inputVideoDeviceInfos;
            })
            .catch(() => {})
            .then(() => {
              resolve(stream);
            });
        })
        .catch((error) => {
          // let {name, constraint, message} = error;
          // console.log(name + ' ' + constraint + ' ' + message);
          // retry...
          setTimeout(() => {
            this.numberOfMaxResolutionTry += 1;
            this._getStreamDeviceMaxResolution(idealFacingMode, exactDeviceId)
              .catch(() => {
                reject(error);
              });
          }, 20);
        });
    });
  }

  _setVideoSrc (stream) {
    if ('srcObject' in this.videoElement) {
      this.videoElement.srcObject = stream;
    } else {
      // using URL.createObjectURL() as fallback for old browsers
      this.videoElement.src = this.windowURL.createObjectURL(stream);
    }
  }

  _setSettings (stream) {
    // default setting is null
    this.settings = null;
    const tracks = (stream && stream.getTracks)
      ? stream.getTracks()
      : [];

    if (tracks.length > 0 && tracks[0].getSettings) {
      this.settings = tracks[0].getSettings();
    }
  }

  _getInputVideoDeviceInfosPromise () {
    return new Promise((resolve, reject) => {
      // only make shure the camera is sarted

      let inputVideoDeviceInfos = [];
      this.mediaDevices.enumerateDevices()
        .then(function (devices) {
          devices.forEach(function (device) {
            if (device.kind === 'videoinput') {
              inputVideoDeviceInfos.push(device);
            }
          });
          resolve(inputVideoDeviceInfos);
        })
        .catch(function (err) {
          reject(err);
        });
    });
  }

  _gotStream (stream) {
    this.stream = stream;
    this._setSettings(stream);
    this._setVideoSrc(stream);
  }

  getCameraSettings () {
    return this.settings;
  }
  getInputVideoDeviceInfos () {
    return this.inputVideoDeviceInfos;
  }

  startCamera (idealFacingMode, idealResolution, exactDeviceId) {
    // stop the stream before playing it.
    return this.stopCamera()
      .then(() => {})
      .catch(() => {})
      // Always called (when the promise is done)
      .then(() => {
        return this._getStreamDevice(idealFacingMode, idealResolution, exactDeviceId);
      });
  }

  startCameraMaxResolution (idealFacingMode = {}, exactDeviceId) {
    // stop the stream before playing it.
    return this.stopCamera()
      .then(() => {})
      .catch(() => {})
      // Always called (when the promise is done)
      .then(() => {
        return this._getStreamDeviceMaxResolution(idealFacingMode, exactDeviceId);
      });
  }

  /**
   * @param {UserConfig} userConfig
   * @return {UserConfig}
   */
  _getDataDefaultConfig (userConfig) {
    return {
      sizeFactor: userConfig.sizeFactor === undefined ? DEFAULT_SIZE_FACTOR : userConfig.sizeFactor,
      imageType: userConfig.imageType === undefined ? DEFAULT_IMAGE_TYPE : userConfig.imageType,
      imageCompression: userConfig.imageCompression === undefined ? DEFAULT_IMAGE_COMPRESSION : userConfig.imageCompression,
      isImageMirror: userConfig.isImageMirror === undefined ? DEFAULT_IMAGE_MIRROR : userConfig.isImageMirror
    };
  }

  /**
   * @param {UserConfig} userConfig
   * @return {string}
   */
  getDataUri (userConfig) {
    return MediaServices.getDataUri(
      this.videoElement,
      this._getDataDefaultConfig(userConfig)
    );
  }

  /**
   * @param {UserConfig} userConfig
   * @return {Promise<*>}
   */
  async getDataBlob (userConfig) {
    return MediaServices.getDataBlob(
      this.videoElement,
      this._getDataDefaultConfig(userConfig)
    );
  }

  /**
   * @param {UserConfig} userConfig
   * @param {string} filename
   * @return {File}
   */
  async getDataFile (userConfig, filename) {
    const dataBlob = await this.getDataBlob(userConfig);

    return new File([dataBlob], filename, {type: dataBlob.type});
  }

  /**
   * This **should** return something like _blob:http://host:port/10a63f26-4552-405c-a060-dee97c8a9f68_,
   * which can be used in _<img src={...} />_ or as background-image.
   * Beware: you should unload this through _URL.revokeObjectURL_ or let it be unloaded by the browser
   * when document is unloaded
   * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
   * @see https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL
   * @param {Blob} dataBlob
   * @return {string}
   */
  blobToUrl (dataBlob) {
    return URL.createObjectURL(dataBlob);
  }

  /**
   * Alias for blobToUrl
   * @param {File} file
   * @return {string}
   */
  fileToUrl (file) {
    return this.blobToUrl(file);
  }

  stopCamera () {
    return new Promise((resolve, reject) => {
      if (this.stream) {
        this.stream.getTracks().forEach(function (track) {
          track.stop();
        });
        this.videoElement.src = '';
        this.stream = null;
        this._setSettings(null);
        resolve();
      }
      reject(Error('no stream to stop!'));
    });
  }
}

export const FACING_MODES = MediaServices.FACING_MODES;
export const IMAGE_TYPES = MediaServices.IMAGE_TYPES;
export {
  DEFAULT_SIZE_FACTOR,
  DEFAULT_IMAGE_COMPRESSION,
  DEFAULT_IMAGE_MIRROR,
  DEFAULT_IMAGE_TYPE
};

export default CameraPhoto;
