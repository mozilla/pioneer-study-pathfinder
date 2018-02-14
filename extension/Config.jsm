const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const EXPORTED_SYMBOLS = ["Config"];

const TELEMETRY_ENV_PREF = "extensions.pioneer-pathfinder.telemetryEnv";
const LOG_INTERVAL_PREF = "extensions.pioneer-pathfinder.logSubmissionInterval";
const IDLE_DELAY_PREF = "extensions.pioneer-pathfinder.idleDelaySeconds";
const LOG_UPLOAD_ATTEMPT_PREF = "extensions.pioneer-pathfinder.logUploadAttemptInterval";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;

const Config = {
  addonId: "pioneer-study-pathfinder@pioneer.mozilla.org",
  studyName: "pathfinder",
  branches: [
    { name: "control", weight: 1, limit: 1 * MEGABYTE },

    // Limit set as per: https://bugzilla.mozilla.org/show_bug.cgi?id=1434714
    // The hard limit is 500000 bytes but we subtract 20% to account for potential size changes
    // from gzipping.
    { name: "safe", weight: 1, limit: 400000 },
  ],
  telemetryEnv: Services.prefs.getCharPref(TELEMETRY_ENV_PREF, "prod"),

  logSubmissionInterval: Services.prefs.getIntPref(LOG_INTERVAL_PREF, 3 * HOUR),
  logUploadAttemptInterval: Services.prefs.getIntPref(LOG_UPLOAD_ATTEMPT_PREF, 15 * MINUTE),

  // Note: This is set in seconds not milliseconds
  idleDelaySeconds: Services.prefs.getIntPref(IDLE_DELAY_PREF, 5),
};
