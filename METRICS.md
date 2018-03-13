Data we are collecting
----------------------

### Event pings

##### Startup/Shutdown pings

These are fired when the study addon is started up or shut down. 

The context will have a integer representing the reason why the event was 
triggered as per below::

```js
REASONS = {
  APP_STARTUP:      1, // The application is starting up.
  APP_SHUTDOWN:     2, // The application is shutting down.
  ADDON_ENABLE:     3, // The add-on is being enabled.
  ADDON_DISABLE:    4, // The add-on is being disabled. (Also sent during uninstallation)
  ADDON_INSTALL:    5, // The add-on is being installed.
  ADDON_UNINSTALL:  6, // The add-on is being uninstalled.
  ADDON_UPGRADE:    7, // The add-on is being upgraded.
  ADDON_DOWNGRADE:  8, // The add-on is being downgraded.
};
```

##### Interval fired

This ping is submitted every time the interval is fired. Intervals are the
type of timer that was used in the original study. We expect this to fire
approximately every 15 minutes.

##### Timer fired

This ping is submitted every time an update timer is fired. Update timers
are an alternative (and potentially more reliable) type of timer that we are
testing. We expect these to fire every 15 minutes however there can be long 
delays between firings because of how they are implemented.

##### Pings / Entries generated

These pings are submitted every time a set of log entries or log pings are
generated. The context tells us how many pings or how many entries we should
expect to see. Additionally the event id contains the type of timer that was
fired to trigger the generation of these entries.

##### Pings Sent

These pings are sent after every successful batch of log pings are submitted.
The context for these pings is the count of pings that were sent. This should
typically match the number of pings generated. The event id contains extra
data about the type of timer that generated the pings and which branch of 
the study was used (the control branch replicating conditions from the original 
study and the safe branch implementing changes that should fix submission issues).
The number of log pings received should always match the context for these
event pings if they come from the safe branch. In the case of the control branch
we expect to see discrepancies.

### Log pings

The log pings are just dummy pings that match the log pings from the original
news study.
