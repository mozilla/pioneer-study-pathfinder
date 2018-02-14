const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Console.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-pathfinder/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "PioneerUtils", "resource://pioneer-study-pathfinder/PioneerUtils.jsm"
);

const Pioneer = {
  startup() {
    this.utils = new PioneerUtils(Config);
  },

  submitEncryptedPing(schemaName, schemaVersion, data, options) {
    if (Services.prefs.getBoolPref("extensions.pioneer-pathfinder.debug", false)) {
      /* eslint-disable no-console */
      console.log("Ping submitted");
      console.log({
        schemaName,
        schemaVersion,
        data,
        options,
      });
      /* eslint-enable no-console */
    }
    this.utils.submitEncryptedPing(schemaName, schemaVersion, data, options);
  }
};

this.EXPORTED_SYMBOLS = ["Pioneer"];
