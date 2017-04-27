/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * @module Etcher.Components.UpdateNotifier
 */

const angular = require('angular');
const electron = require('electron');
const Bluebird = require('bluebird');
const _ = require('lodash');
const settings = require('../models/settings');
const units = require('../../shared/units');

const MODULE_NAME = 'Etcher.Components.UpdateNotifier';
const UpdateNotifier = angular.module(MODULE_NAME, [
  require('../os/open-external/open-external'),
  require('../modules/analytics')
]);

UpdateNotifier.service('UpdateNotifierService', function(AnalyticsService, OSOpenExternalService) {

  /**
   * @summary The number of days the update notifier can be put to sleep
   * @constant
   * @private
   * @type {Number}
   */
  this.UPDATE_NOTIFIER_SLEEP_DAYS = 7;

  /**
   * @summary Determine if it's time to check for updates
   * @function
   * @public
   *
   * @param {Object} [options] - options
   * @param {Boolean} [options.ignoreSleepUpdateCheck] - ignore sleep update check
   * @param {Number} [options.lastSleptUpdateNotify] - last slept update notify time
   * @returns {Boolean} should check for updates
   *
   * @example
   * if (UpdateNotifierService.shouldCheckForUpdates({
   *   ignoreSleepUpdateCheck: false,
   *   lastSleptUpdateNotify: Date.now()
   * })) {
   *   console.log('We should check for updates!');
   * }
   */
  this.shouldCheckForUpdates = (options = {}) => {
    if (_.some([
      !options.lastSleptUpdateNotify,
      _.get(options, [ 'ignoreSleepUpdateCheck' ], false)
    ])) {
      return true;
    }

    if (options.lastSleptUpdateNotify - Date.now() > units.daysToMilliseconds(this.UPDATE_NOTIFIER_SLEEP_DAYS)) {
      return true;
    }

    return false;
  };

  /**
   * @summary Open the update notifier widget
   * @function
   * @public
   *
   * @param {String} version - version
   * @param {Object} [options] - options
   * @param {Boolean} [options.allowSleepUpdateCheck=true] - allow sleeping the update check
   * @returns {Promise}
   *
   * @example
   * UpdateNotifierService.notify('1.0.0-beta.16', {
   *   allowSleepUpdateCheck: true
   * });
   */
  this.notify = (version, options = {}) => {
    const BUTTONS = [
      'Download',
      'Skip'
    ];

    const BUTTON_CONFIRMATION_INDEX = _.indexOf(BUTTONS, _.first(BUTTONS));
    const BUTTON_REJECTION_INDEX = _.indexOf(BUTTONS, _.last(BUTTONS));

    const dialogOptions = {
      type: 'info',
      buttons: BUTTONS,
      defaultId: BUTTON_CONFIRMATION_INDEX,
      cancelId: BUTTON_REJECTION_INDEX,
      title: 'New Update Available!',
      message: `Etcher ${version} is available for download`
    };

    if (_.get(options, [ 'allowSleepUpdateCheck' ], true)) {
      _.merge(dialogOptions, {
        checkboxLabel: `Remind me again in ${this.UPDATE_NOTIFIER_SLEEP_DAYS} days`,
        checkboxChecked: false
      });
    }

    return new Bluebird((resolve) => {
      const currentWindow = electron.remote.getCurrentWindow();
      electron.remote.dialog.showMessageBox(currentWindow, dialogOptions, (response, checkboxChecked) => {
        return resolve({
          agreed: response === BUTTON_CONFIRMATION_INDEX,
          sleepUpdateCheck: checkboxChecked || false
        });
      });
    }).then((results) => {
      if (results.sleepUpdateCheck) {
        settings.set('lastSleptUpdateNotify', Date.now());
      }

      AnalyticsService.logEvent('Close update modal', {
        sleepUpdateCheck: results.sleepUpdateCheck,
        notifyVersion: version
      });

      if (results.agreed) {
        OSOpenExternalService.open('https://etcher.io?ref=etcher_update');
      }
    });
  };

});

module.exports = MODULE_NAME;
