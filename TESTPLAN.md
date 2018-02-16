# Test plan

## Overview

This add-on runs a 1 week study that generates and submits logs similar to the
online news study logs and additional metadata to try and understand why the 
online news study experienced significant data loss.

## Installation

Please install the Firefox Pioneer add-on to test this study.

If you install the add-on without the Firefox Pioneer add-on installed, the study 
add-on will be immediately uninstalled and will send an ineligible event ping to
Telemetry.

There are some preferences for this add-on which can be set before the add-on is
installed. If they are set once the add-on has been installed you will need to 
restart the browser for the change to take effect.

### Available preferences

#### `extensions.pioneer-pathfinder.telemetryEnv`

**Values:** `stage`, `prod`

**Default:** `prod`

If you have configured telemetry to submit to the stage environment you should
set this to `stage` to ensure that the correct encryption key is used.

#### `extensions.pioneer-pathfinder.debug`

**Default:** `false`

A boolean setting that determines whether or not to log debugging info in the 
console.

#### `extensions.pioneer-pathfinder.logSubmissionInterval`

**Default:** `10800000` (3 hours)

This sets the minimum time in milliseconds before the log data is submitted to 
Telemetry and then the log is purged. It defaults to three hours. It should not 
be set to less than 2 minutes.

#### `extensions.pioneer-pathfinder.logUploadAttemptInterval`

**Default:** `900000` (15 minutes)

This sets the frequency at which the add-on attempts to upload the log. If the
time specified in [`extensions.pioneer-pathfinder.logSubmissionInterval`](#extensionspioneer-pathfinderlogsubmissioninterval) has 
not passed it will not be uploaded. You should make sure this is always less
than [`extensions.pioneer-pathfinder.logSubmissionInterval`](#extensionspioneer-pathfinderlogsubmissioninterval).

#### `extensions.pioneer-pathfinder.studyBranch`

**Values:** `safe`, `control`

This is set during the second phase of the study.

The `safe` branch is where the telemetry pings should all be sent without errors.

The `control` branch is where telemetry pings may result in the following error:

```
RangeError: too many arguments provided for a function call
```

### Building the add-on

1. Clone the repo; `git clone https://github.com/rehandalal/pioneer-study-pathfinder.git`
2. Install the dependencies using `npm install`.
3. Build the XPI file using `npm run build`.
4. You will find an XPI file in a `dist` subdirectory.

### Installing the add-on

1. In your Firefox profile open `about:config`
2. Find the pref `extensions.legacy.enabled` and make sure it is set to `true`.
3. Find the pref `devtools.chrome.enabled` and make sure it is set to `true`.
4. Go to `about:addons` > `extensions`.
5. Open the drop-down menu with the cog icon in the upper right corner and choose
   `Install Add-on From File`.

## Test Conditions

### Before each test

Before running each test please make sure you create a new clean profile. The 
easiest way is to go to `about:profiles`. More information can be found here:
<https://developer.mozilla.org/Firefox/Multiple_profiles>

It is also a good idea to set [`extensions.pioneer-pathfinder.debug`](#extensionspioneer-pathfinderdebug) to `true`
so that you can see unencrypted ping data in the console.

### Tests to perform

#### Test that event pings are being sent

At an interval set by [`extensions.pioneer-pathfinder.logUploadAttemptInterval`](#extensionspioneer-pathfinderloguploadattemptinterval)
you should see one or two event pings that are generated. 

One will have the `eventId` of `intervalFired` which represents the 
`setInterval` type of timer firing. 

Another will have the `eventId` of `timerFired` which represents the 
`nsIUpdateTimerManager` type of timer firing.

The latter type of timer may be delayed by other `nsIUpdateTimerManager` type
timers which all (including timers set by other add-ons and the browser itself) 
get queued and only triggered at a minimum of 2 minutes apart.

At an interval set by [`extensions.pioneer-pathfinder.logSubmissionInterval`](#extensionspioneer-pathfinderlogsubmissioninterval)
you should see three event pings that are generated for each type of timer.

One will have an `eventId` prefixed with `pingsGenerated:` and a `context` set 
to the number of pings generated.

Another will have an `eventId` prefixed with `entriesGenerated:` and a `context`
set to the number of entries generated. This may be 0.

The last will have an `eventId` prefixed with `pingsSent:` and a `context` set
to the number of pings submitted.

The `pingsGenerated` and `pingsSent` types of event ping should have 
matching `context` numbers.

##### Test the log ping

The log pings are batched and a submission is attempted 15 minutes, however they 
are only submitted once every 3 hours. You may change this by changing the 
[`extensions.pioneer-pathfinder.logSubmissionInterval`](#extensionspioneer-pathfinderlogsubmissioninterval) preference. You will need 
to restart Firefox or set this pref before installing for this pref change to 
take effect.

The number of log pings that are sent should match the `context` numbers of the
`pingsGenerated` and `pingsSent` type of event pings.
