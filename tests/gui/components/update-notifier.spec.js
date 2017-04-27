'use strict';

const m = require('mochainon');
const angular = require('angular');
const units = require('../../../lib/shared/units');
require('angular-mocks');

describe('Browser: UpdateNotifier', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/components/update-notifier')
  ));

  describe('UpdateNotifierService', function() {

    describe('.shouldCheckForUpdates()', function() {

      let UpdateNotifierService;

      beforeEach(angular.mock.inject(function(_UpdateNotifierService_) {
        UpdateNotifierService = _UpdateNotifierService_;
      }));

      describe('given the `lastSleptUpdateNotify` was never updated', function() {

        it('should return true if ignoreSleepUpdateCheck is false', function() {
          const result = UpdateNotifierService.shouldCheckForUpdates({
            ignoreSleepUpdateCheck: false,
            lastSleptUpdateNotify: undefined
          });

          m.chai.expect(result).to.be.true;
        });

        it('should return true if ignoreSleepUpdateCheck is true', function() {
          const result = UpdateNotifierService.shouldCheckForUpdates({
            ignoreSleepUpdateCheck: true,
            lastSleptUpdateNotify: undefined
          });

          m.chai.expect(result).to.be.true;
        });

      });

      describe('given the `lastSleptUpdateNotify` was very recently updated', function() {

        it('should return false if ignoreSleepUpdateCheck is false', function() {
          const result = UpdateNotifierService.shouldCheckForUpdates({
            ignoreSleepUpdateCheck: false,
            lastSleptUpdateNotify: Date.now() + 1000
          });

          m.chai.expect(result).to.be.false;
        });

        it('should return true if ignoreSleepUpdateCheck is true', function() {
          const result = UpdateNotifierService.shouldCheckForUpdates({
            ignoreSleepUpdateCheck: true,
            lastSleptUpdateNotify: Date.now() + 1000
          });

          m.chai.expect(result).to.be.true;
        });

      });

      describe('given the `lastSleptUpdateNotify` was updated long ago', function() {

        it('should return true if ignoreSleepUpdateCheck is false', function() {
          const SLEEP_MS = units.daysToMilliseconds(UpdateNotifierService.UPDATE_NOTIFIER_SLEEP_DAYS);

          const result = UpdateNotifierService.shouldCheckForUpdates({
            ignoreSleepUpdateCheck: false,
            lastSleptUpdateNotify: Date.now() + SLEEP_MS + 1000
          });

          m.chai.expect(result).to.be.true;
        });

        it('should return true if ignoreSleepUpdateCheck is true', function() {
          const SLEEP_MS = units.daysToMilliseconds(UpdateNotifierService.UPDATE_NOTIFIER_SLEEP_DAYS);

          const result = UpdateNotifierService.shouldCheckForUpdates({
            ignoreSleepUpdateCheck: true,
            lastSleptUpdateNotify: Date.now() + SLEEP_MS + 1000
          });

          m.chai.expect(result).to.be.true;
        });

      });

    });

  });

});
