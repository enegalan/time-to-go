export const CONFIG_NAMES = {
    ROOT: 'timeToGo',
    TIME_FORMAT: 'timeFormat',
    SHOW_HOURS: 'showHours',
    SHOW_MINUTES: 'showMinutes',
    SHOW_SECONDS: 'showSeconds',
    TIME_SEPARATOR: 'timeSeparator',
    FLASH_TIME_SEPARATORS: 'flashTimeSeparators',
    TIME_SEPARATOR_OFF: 'timeSeparatorOff',
    NOTIFICATIONS_ENABLED: 'notificationsEnabled',
    NOTIFICATION_MINUTES: 'notificationMinutes',
    PERIODIC_NOTIFICATIONS: 'periodicNotifications',
} as const;

export const TIME_FORMATS = {
    HUMAN_READABLE: 'human-readable',
    TIME_FORMAT: 'time-format',
} as const;

export const COMMANDS = {
    CONFIGURE: 'timeToGo.configure',
    TOGGLE: 'timeToGo.toggle',
    STATUS: 'timeToGo.status',
    OPEN_SETTINGS: 'workbench.action.openSettings',
} as const;

export const DAY_NAMES = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
] as const;

export const TIME_CONSTANTS = {
    MILLISECONDS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    SECONDS_PER_HOUR: 3600,
    MINUTES_PER_HOUR: 60,
    DEFAULT_UPDATE_INTERVAL_MS: 60000,
    UPDATE_INTERVAL_WITH_SECONDS_MS: 1000,
    FLASH_INTERVAL_MS: 1000,
    NOTIFICATION_CHECK_INTERVAL_MS: 60000,
    PARSE_INT_BASE: 10,
    ZERO_SECONDS: 0,
    ZERO_MILLISECONDS: 0,
    ZERO_TIME_VALUE: 0,
} as const;

export const STATUS_BAR = {
    PRIORITY: -9e9,
    ALIGNMENT: 'right' as const,
    TEXT_PREFIX: '$(clock) Time to go: ',
    TOOLTIP_PREFIX: 'End time: ',
} as const;

export const TIME_DISPLAY = {
    HOUR_SUFFIX: 'h',
    MINUTE_SUFFIX: 'm',
    SECOND_SUFFIX: 's',
    HUMAN_READABLE_SEPARATOR: ' ',
    DEFAULT_TIME_SEPARATOR: ':',
    DEFAULT_TIME_SEPARATOR_OFF: ' ',
    PADDING_LENGTH: 2,
    PADDING_CHAR: '0',
    ZERO_HOURS: '0h',
    ZERO_MINUTES: '0m',
    ZERO_SECONDS: '0s',
    ZERO_TIME: '0',
    END_TIME_FORMAT_OPTIONS: { hour: '2-digit', minute: '2-digit', second: '2-digit' } as Intl.DateTimeFormatOptions,
} as const;

export const DEFAULT_VALUES = {
    TIME_FORMAT: TIME_FORMATS.HUMAN_READABLE,
    SHOW_HOURS: true,
    SHOW_MINUTES: true,
    SHOW_SECONDS: false,
    TIME_SEPARATOR: TIME_DISPLAY.DEFAULT_TIME_SEPARATOR,
    TIME_SEPARATOR_OFF: TIME_DISPLAY.DEFAULT_TIME_SEPARATOR_OFF,
    FLASH_TIME_SEPARATORS: false,
    NOTIFICATIONS_ENABLED: true,
    NOTIFICATION_MINUTES: 30,
    DAY_START_TIME: '09:00',
    DAY_END_TIME: '18:00',
    DAY_ENABLED: false,
} as const;

export const MESSAGES = {
    EXTENSION_ACTIVATED: 'Time to Go extension activated',
    ENABLED: 'Time to Go enabled',
    DISABLED: 'Time to Go disabled',
    NOT_INITIALIZED: 'Time to Go is not initialized',
    NOT_CONFIGURED_DAY: 'Today is not a configured work day',
    OUTSIDE_WORK_HOURS: "Outside work hours. Today's schedule: ",
    NO_SCHEDULE: 'No schedule configured for today',
    TIME_REMAINING: 'Time remaining: ',
    END_TIME_LABEL: '\nEnd time: ',
    NOTIFICATION_MINUTES_LEFT: (minutes: number, endTime: string) =>
        `⏰ You have ${minutes} minutes left to leave (${endTime})`,
    TIME_TO_GO: '🎉 Time to go!',
} as const;
