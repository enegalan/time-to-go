# Time to Go

<img src="images/icon.png" width="512" height="512" alt="Time to Go" />

A VSCode extension that displays the remaining time until your end time in the status bar.

## Features

- Different schedule configuration for each day of the week
- Real-time counter in the status bar with informative tooltip (start, end, elapsed, remaining)
- Multiple configurable display formats
- Notifications before end time and when end time is reached

## Commands

- **Time to Go: Configure Schedule** – Open Time to Go settings
- **Time to Go: Toggle** – Enable or disable the extension (state is persisted across window reloads)
- **Time to Go: Show Status** – Show remaining time and schedule in a message (clicking the status bar item runs this)

## Configuration

Configure your schedule in VS Code preferences. Each day has:

- `timeToGo.<day>.enabled` – Enable or disable that day
- `timeToGo.<day>.start` / `timeToGo.<day>.end` – Start and end time in HH:MM (e.g. `timeToGo.monday.start`, `timeToGo.monday.end`)

**Time display:**

- `timeToGo.timeFormat` – Display format: `human-readable` (e.g. "1h 30m") or `time-format` (e.g. "1:30")
- `timeToGo.showHours` / `timeToGo.showMinutes` / `timeToGo.showSeconds` – Control which units are shown
- `timeToGo.timeSeparator` – Character used as separator in time format (default: ":")
- `timeToGo.flashTimeSeparators` – Flash the separator on and off every second (time format only)
- `timeToGo.timeSeparatorOff` – Character shown when the separator is off during flash

**Notifications:**

- `timeToGo.notificationMinutes` – Minutes before end time to show a notification (default: 30)
- `timeToGo.notificationsEnabled` – Enable or disable notifications before end time and the "Time to go!" notification when end time is reached
- `timeToGo.periodicNotifications` – Array of periodic notifications. Each entry has: `message` (string), `interval` (seconds between notifications), `days` (array of weekday names: "monday", "tuesday", etc.). When periodic notifications are configured with intervals under 60 seconds, the check runs at the shortest interval.

## Development

```bash
npm install
npm run compile
npm run watch
```

Press F5 to run the extension in debug mode.
