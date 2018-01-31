/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const { utils: Cu } = Components;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Timer.jsm");

XPCOMUtils.defineLazyModuleGetter(
  this, "Config", "resource://pioneer-study-pathfinder/Config.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "Pioneer", "resource://pioneer-study-pathfinder/lib/Pioneer.jsm"
);
XPCOMUtils.defineLazyModuleGetter(
  this, "PrefUtils", "resource://pioneer-study-pathfinder/lib/PrefUtils.jsm"
);
XPCOMUtils.defineLazyServiceGetter(
  this, "timerManager", "@mozilla.org/updates/timer-manager;1", "nsIUpdateTimerManager"
);

this.EXPORTED_SYMBOLS = ["LogHandler"];

const UPLOAD_DATE_PREF = "extensions.pioneer-study-pathfinder.lastLogUploadDate";

const TIMER_NAME = "pioneer-pathfinder-timer";

const KILOBYTE = 1024;
const MEGABYTE = 1024 * KILOBYTE;
const UPLOAD_LIMIT = 1 * MEGABYTE;

let padding = 0.95;
let perEntryPingSizeIncrease = {};

let intervalId;


this.LogHandler = {
  startup() {
    this.uploadPings("timer");
    this.uploadPings("interval");

    // Timers done the way they were in the online news study
    intervalId = setInterval(this.handleInterval.bind(this), Config.logUploadAttemptInterval);

    // Alternate timers to verify if timers were the issue
    timerManager.registerTimer(
      TIMER_NAME, this.handleTimer.bind(this), Config.logUploadAttemptInterval
    );
  },

  shutdown() {
    if (intervalId) {
      clearTimeout(intervalId);
      timerManager.unregisterTimer(TIMER_NAME);
    }
  },

  async handleInterval() {
    const payload = {
      eventId: "intervalFired",
      timestamp: Math.round(Date.now() / 1000),
      context: "",
    };
    await Pioneer.submitEncryptedPing("pathfinder-event", 1, payload);
    this.uploadPings("interval");
  },

  async handleTimer() {
    const payload = {
      eventId: "timerFired",
      timestamp: Math.round(Date.now() / 1000),
      context: "",
    };
    await Pioneer.submitEncryptedPing("pathfinder-event", 1, payload);
    this.uploadPings("timer");
  },

  async generateEntries(type) {
    const pingCount = Math.floor(Math.random() * 5) + 1; // Returns a random number from 1-5

    const entriesMinSize = UPLOAD_LIMIT * (pingCount - 1);

    const entry = {
      url: "pathfinder",
      timestamp: Math.round(Date.now() / 1000),
      details: `entry:${type}`,
    };

    // Calculate and cache the size increase of adding one entry to a ping
    let sizeDelta = perEntryPingSizeIncrease[type];
    if (!sizeDelta) {
      const oneEntrySize = await Pioneer.utils.getEncryptedPingSize("pathfinder-log", 1, {
        entries: [entry],
      });
      const twoEntrySize = await Pioneer.utils.getEncryptedPingSize("pathfinder-log", 1, {
        entries: [
          entry,
          entry,
        ],
      });
      sizeDelta = twoEntrySize - oneEntrySize;
      perEntryPingSizeIncrease[type] = sizeDelta;
    }

    const entryCount = Math.ceil(entriesMinSize / (sizeDelta * padding));

    const entries = Array(entryCount).fill(entry);

    await Pioneer.submitEncryptedPing("pathfinder-event", 1, {
      eventId: `pingsGenerated:${type}`,
      timestamp: Math.round(Date.now() / 1000),
      context: `${pingCount}`,
    });

    await Pioneer.submitEncryptedPing("pathfinder-event", 1, {
      eventId: `entriesGenerated:${type}`,
      timestamp: Math.round(Date.now() / 1000),
      context: `${entries.length}`,
    });

    return entries;
  },

  async uploadPings(type) {
    const uploadDatePrefName = `${UPLOAD_DATE_PREF}.${type}`;

    // upload ping dataset at most once a day
    const lastUploadDate = PrefUtils.getLongPref(uploadDatePrefName, 0);
    const timesinceLastUpload = Date.now() - lastUploadDate;
    let pingCount = 0;

    if (timesinceLastUpload > Config.logSubmissionInterval) {
      let entries = await this.generateEntries(type);
      let payload = { entries };
      const entriesPingSize = await Pioneer.utils.getEncryptedPingSize(
        "pathfinder-log", 1, payload
      );

      if (entriesPingSize < UPLOAD_LIMIT) {
        // If the ping is small enough, just submit it directly
        await Pioneer.submitEncryptedPing("pathfinder-log", 1, payload);
        PrefUtils.setLongPref(uploadDatePrefName, Date.now());

        await Pioneer.submitEncryptedPing("pathfinder-event", 1, {
          eventId: `pingsSent:${type}`,
          timestamp: Math.round(Date.now() / 1000),
          context: "1",
        });
      } else {
        // Otherwise, break it into batches below the minimum size
        const reduceRatio = UPLOAD_LIMIT / entriesPingSize;
        const originalEntriesLength = entries.length;
        let batch = [];

        while (entries.length > 0) {
          const batchSize = Math.floor(originalEntriesLength * reduceRatio * padding);
          if (batchSize < 1) {
            throw new Error("could not submit batch of any size");
          }

          batch = entries.splice(0, batchSize);
          payload = { entries: batch };
          const batchPingSize = await Pioneer.utils.getEncryptedPingSize(
            "pathfinder-log", 1, payload
          );

          if (batchPingSize >= UPLOAD_LIMIT) {
            // not small enough, put the batch back in the pool,
            // reduce the batch size and try again
            padding -= 0.05;
            entries = batch.concat(entries);
            continue;
          }

          await Pioneer.submitEncryptedPing("pathfinder-log", 1, payload);
          pingCount++;
        }

        await Pioneer.submitEncryptedPing("pathfinder-event", 1, {
          eventId: `pingsSent:${type}`,
          timestamp: Math.round(Date.now() / 1000),
          context: `${pingCount}`,
        });

        PrefUtils.setLongPref(uploadDatePrefName, Date.now());
      }
    }
  },
};
