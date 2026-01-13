# Time to Go

A VSCode extension that displays the remaining time until your end time in the status bar.

## Features

- Different schedule configuration for each day of the week
- Real-time counter in the status bar
- Multiple configurable display formats
- Notifications before end time

## Configuration

Configure your schedule in VS Code preferences:

- `timeToGo.monday.start` / `timeToGo.monday.end` - Monday schedule
- `timeToGo.tuesday.start` / `timeToGo.tuesday.end` - Tuesday schedule
- ... (and so on for all days)

- `timeToGo.timeFormat` - Display format:
  - `human-readable` - "1h 30m 20s"
  - `human-readable-no-seconds` - "1h 30m"
  - `time-format` - "1:30:20"
  - `time-format-no-seconds` - "1:30"

- `timeToGo.notificationMinutes` - Minutes before end time to notify (default: 30)
- `timeToGo.notificationsEnabled` - Enable/disable notifications

## Development

```bash
npm install
npm run compile
npm run watch
```

Press F5 to run the extension in debug mode.
