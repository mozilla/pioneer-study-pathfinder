/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-pathfinder/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "LogHandler", "resource://pioneer-study-pathfinder/lib/LogHandler.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Pioneer", "resource://pioneer-study-pathfinder/lib/Pioneer.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "PrefUtils", "resource://pioneer-study-pathfinder/lib/PrefUtils.jsm"
);

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const REASONS = {
  APP_STARTUP:      1, // The application is starting up.
  APP_SHUTDOWN:     2, // The application is shutting down.
  ADDON_ENABLE:     3, // The add-on is being enabled.
  ADDON_DISABLE:    4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL:    5, // The add-on is being installed.
  ADDON_UNINSTALL:  6, // The add-on is being uninstalled.
  ADDON_UPGRADE:    7, // The add-on is being upgraded.
  ADDON_DOWNGRADE:  8, // The add-on is being downgraded.
};
const UI_AVAILABLE_NOTIFICATION = "sessionstore-windows-restored";
const EXPIRATION_DATE_PREF = "extensions.pioneer-pathfinder.expirationDate";

let isStartupFinished;


this.Bootstrap = {
  install() {},

  async startup(data, reason) {
    // Check if the user is opted in to pioneer and if not end the study
    Pioneer.startup();
    const events = Pioneer.utils.getAvailableEvents();

    const isEligible = await Pioneer.utils.isUserOptedIn();
    if (!isEligible) {
      Pioneer.utils.endStudy(events.INELIGIBLE);
      return;
    }

    const payload = {
      eventId: 'startup',
      timestamp: Math.round(Date.now() / 1000),
      context: `${reason}`,
    };
    await Pioneer.submitEncryptedPing("pathfinder-event", 1, payload);

    // Always set EXPIRATION_DATE_PREF if it not set, even if outside of install.
    // This is a failsafe if opt-out expiration doesn't work, so should be resilient.
    let expirationDate = PrefUtils.getLongPref(EXPIRATION_DATE_PREF, 0);
    if (!expirationDate) {
      expirationDate = Date.now() + (1 * WEEK);
      PrefUtils.setLongPref(EXPIRATION_DATE_PREF, expirationDate);
    }

    // Check if the study has expired
    if (Date.now() > expirationDate) {
      Pioneer.utils.endStudy(events.EXPIRED);
      return;
    }

    // If the app is starting up, wait until the UI is available before finishing
    // init.
    if (reason === REASONS.APP_STARTUP) {
      Services.obs.addObserver(this, UI_AVAILABLE_NOTIFICATION);
    } else {
      this.finishStartup();
    }
  },

  observe(subject, topic, data) {
    if (topic === UI_AVAILABLE_NOTIFICATION) {
      Services.obs.removeObserver(this, UI_AVAILABLE_NOTIFICATION);
      this.finishStartup();
    }
  },

  /**
   * Add-on startup tasks delayed until after session restore so as
   * not to slow down browser startup.
   */
  async finishStartup() {
    LogHandler.startup();
    isStartupFinished = true;
  },

  async shutdown(data, reason) {
    // In case the observer didn't run, clean it up.
    try {
      Services.obs.removeObserver(this, UI_AVAILABLE_NOTIFICATION);
    } catch (err) {
      // It must already be removed!
    }

    const payload = {
      eventId: 'shutdown',
      timestamp: Math.round(Date.now() / 1000),
      context: `${reason}`,
    };
    await Pioneer.submitEncryptedPing("pathfinder-event", 1, payload);

    if (isStartupFinished) {
      LogHandler.shutdown();
    }

    Cu.unload("resource://pioneer-study-pathfinder/Config.jsm");
    Cu.unload("resource://pioneer-study-pathfinder/lib/Pioneer.jsm");
    Cu.unload("resource://pioneer-study-pathfinder/lib/PrefUtils.jsm");
    Cu.unload("resource://pioneer-study-pathfinder/lib/LogHandler.jsm");
  },

  uninstall() {},
};

// Expose bootstrap methods on the global
for (const methodName of ["install", "startup", "shutdown", "uninstall"]) {
  this[methodName] = Bootstrap[methodName].bind(Bootstrap);
}
