const { utils: Cu } = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const EXPORTED_SYMBOLS = ["Config"];

const TELEMETRY_ENV_PREF = "extensions.pioneer-online-news.telemetryEnv";
const UPDATE_TIMER_PREF = "extensions.pioneer-online-news.updateTimerInterval";
const DOORHANGER_INTERVAL_PREF = "extensions.pioneer-online-news.showDoorhangerInterval";
const LOG_INTERVAL_PREF = "extensions.pioneer-online-news.logSubmissionInterval";
const PRETREATMENT_DURATION_PREF = "extensions.pioneer-online-news.preTreatmentDuration";
const TREATMENT_DURATION_PREF = "extensions.pioneer-online-news.treatmentDuration";
const POSTTREATMENT_DURATION_PREF = "extensions.pioneer-online-news.postTreatmentDuration";
const POSTSTUDY_DURATION_PREF = "extensions.pioneer-online-news.postStudyDuration";
const IDLE_DELAY_PREF = "extensions.pioneer-online-news.idleDelaySeconds";
const LOG_UPLOAD_ATTEMPT_PREF = "extensions.pioneer-online-news.logUploadAttemptInterval";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const Config = {
  addonId: "pioneer-study-pathfinder@mozilla.org",
  studyName: "online-news",
  branches: [
    { name: "control", weight: 1 },
    { name: "treatment", weight: 1, showDoorhanger: true },
  ],
  telemetryEnv: Services.prefs.getCharPref(TELEMETRY_ENV_PREF, "prod"),

  updateTimerInterval: Services.prefs.getIntPref(UPDATE_TIMER_PREF, 1 * DAY),
  showDoorhangerInterval: Services.prefs.getIntPref(DOORHANGER_INTERVAL_PREF, 1 * DAY),
  logSubmissionInterval: Services.prefs.getIntPref(LOG_INTERVAL_PREF, 1 * DAY),
  logUploadAttemptInterval: Services.prefs.getIntPref(LOG_UPLOAD_ATTEMPT_PREF, 3 * HOUR),

  // Note: This is set in seconds not milliseconds
  idleDelaySeconds: Services.prefs.getIntPref(IDLE_DELAY_PREF, 5),
};
