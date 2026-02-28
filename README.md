# Time to Go

<img src="images/icon.png" width="512" height="512" alt="Time to Go" />

Know exactly how much time you have left until you can leave working hours. Set your start and end times and see the countdown in your editor.

## Features

- Different schedule configuration for each day of the week
- Real-time counter in the status bar with tooltip showing end time
- Multiple configurable display formats
- Notifications before end time and when end time is reached

## Quickstart

1. Open VS Code settings and search for `Time to Go`, or use the Command Palette and run **Time to Go: Configure Schedule**.
2. Configure your start and end times for the days you work.
3. Look at the status bar clock to see how much time you have left until you can leave.

## Commands

- **Time to Go: Configure Schedule** – Open Time to Go settings
- **Time to Go: Toggle** – Enable or disable the extension (state is persisted across window reloads)
- **Time to Go: Show Status** – Show remaining time and schedule in a message

## Configuration Options

Configure your schedule in VS Code preferences (search for **Time to Go** or use **Time to Go: Configure Schedule**).

### Schedule (per day)

| Setting                  | Value(s)              | Description      | Example                | Default   |
| ------------------------ | --------------------- | ---------------- | ---------------------- | --------- |
| `timeToGo.<day>.enabled` | **true**              | Enable that day  | included in schedule   | **true**  |
|                          | **false**             | Disable that day | excluded from schedule |           |
| `timeToGo.<day>.start`   | `HH:MM` or `HH:MM:SS` | Start time       | 09:00                  | **09:00** |
| `timeToGo.<day>.end`     | `HH:MM` or `HH:MM:SS` | End time         | 18:00                  | **18:00** |


### Time display

| Setting                        | Value(s)           | Description                                       | Example        | Default            |
| ------------------------------ | ------------------ | ------------------------------------------------- | -------------- | ------------------ |
| `timeToGo.timeFormat`          | **human-readable** | Display format                                    | 1h 30m 45s     | **human-readable** |
|                                | **time-format**    |                                                   | 1:30           |                    |
| `timeToGo.timeSeparator`       | **string**         | Separator in time-format                          | 1:30           | **:**              |
| `timeToGo.showHours`           | **true**           | Hours shown in status bar                         | **1h** 30m     | **true**           |
|                                | **false**          | Hours hidden                                      | 30m            |                    |
| `timeToGo.showMinutes`         | **true**           | Minutes shown in status bar                       | 1h **30m**     | **true**           |
|                                | **false**          | Minutes hidden                                    | 1h             |                    |
| `timeToGo.showSeconds`         | **true**           | Seconds shown in status bar                       | 1h 30m **45s** | **false**          |
|                                | **false**          | Seconds hidden                                    | 1h 30m         |                    |
| `timeToGo.flashTimeSeparators` | **true**           | Separator flashes every second (time-format only) | 1:30 ⇆ 1 30    | **false**          |
|                                | **false**          | Separator static                                  | 1:30           |                    |
| `timeToGo.timeSeparatorOff`    | **string**         | Character when separator is off during flash      | 1 30           |                    |


### Notifications

| Setting                          | Value(s)                                      | Description                                                            | Example             | Default  |
| -------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------- | ------------------- | -------- |
| `timeToGo.notificationMinutes`   | number                                        | Minutes before end time to show a notification                         | 30                  | **30**   |
| `timeToGo.notificationsEnabled`  | **true**                                      | Notifications before end and "Time to go!" at end time                 | notifications shown | **true** |
|                                  | **false**                                     | Notifications disabled                                                 | no notifications    |          |
| `timeToGo.periodicNotifications` | array of objects (see below) | Custom periodic notifications during work hours. Intervals under 60s use the shortest check. |                     | **[]**   |

Each entry in **`timeToGo.periodicNotifications`** is an object with:

| Property   | Type     | Description                                      | Example                          |
| ---------- | -------- | ------------------------------------------------ | -------------------------------- |
| **message**  | string   | Text shown in the notification                   | `"Take a break?"`                |
| **interval** | number   | Seconds between notifications on the given days  | `3600` (every hour)              |
| **days**     | string[] | Weekdays when this notification runs             | `["monday", "tuesday", "friday"]` |

Example in `settings.json`:

```json
"timeToGo.periodicNotifications": [
  {
    "message": "Time for a break? 🥱",
    "interval": 3600,
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
]
```
