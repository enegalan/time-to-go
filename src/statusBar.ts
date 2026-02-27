import * as vscode from 'vscode';
import { TimeTracker, TimeRemaining } from './timeTracker';
import {
    CONFIG_NAMES,
    TIME_FORMATS,
    TIME_CONSTANTS,
    STATUS_BAR,
    TIME_DISPLAY,
    DEFAULT_VALUES,
    COMMANDS,
} from './constants';

export type TimeFormat = typeof TIME_FORMATS.HUMAN_READABLE | typeof TIME_FORMATS.TIME_FORMAT;

export class StatusBar {
    private statusBarItem: vscode.StatusBarItem;
    private timeTracker: TimeTracker;
    private config: vscode.WorkspaceConfiguration;
    private updateInterval: NodeJS.Timeout | null = null;
    private flashInterval: NodeJS.Timeout | null = null;
    private updateFrequency: number = TIME_CONSTANTS.DEFAULT_UPDATE_INTERVAL_MS;
    private flashState: boolean = true;
    private cachedShowHours: boolean = DEFAULT_VALUES.SHOW_HOURS;
    private cachedShowMinutes: boolean = DEFAULT_VALUES.SHOW_MINUTES;
    private cachedShowSeconds: boolean = DEFAULT_VALUES.SHOW_SECONDS;
    private cachedTimeSeparator: string = DEFAULT_VALUES.TIME_SEPARATOR;
    private cachedFlashTimeSeparators: boolean = DEFAULT_VALUES.FLASH_TIME_SEPARATORS;
    private cachedTimeSeparatorOff: string = DEFAULT_VALUES.TIME_SEPARATOR_OFF;
    private cachedTimeFormat: TimeFormat = DEFAULT_VALUES.TIME_FORMAT;
    private cachedEndHasSeconds: boolean = false;

    constructor(timeTracker: TimeTracker) {
        this.timeTracker = timeTracker;
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            STATUS_BAR.PRIORITY
        );
        this.statusBarItem.command = COMMANDS.STATUS;
        this.refreshFormatCache();
        this.updateFrequencyFromFormat();
    }

    private refreshFormatCache(): void {
        this.cachedShowHours = this.config.get<boolean>(CONFIG_NAMES.SHOW_HOURS, DEFAULT_VALUES.SHOW_HOURS);
        this.cachedShowMinutes = this.config.get<boolean>(CONFIG_NAMES.SHOW_MINUTES, DEFAULT_VALUES.SHOW_MINUTES);
        this.cachedShowSeconds = this.config.get<boolean>(CONFIG_NAMES.SHOW_SECONDS, DEFAULT_VALUES.SHOW_SECONDS);
        this.cachedTimeSeparator = this.config.get<string>(CONFIG_NAMES.TIME_SEPARATOR, DEFAULT_VALUES.TIME_SEPARATOR);
        this.cachedFlashTimeSeparators = this.config.get<boolean>(
            CONFIG_NAMES.FLASH_TIME_SEPARATORS,
            DEFAULT_VALUES.FLASH_TIME_SEPARATORS
        );
        this.cachedTimeSeparatorOff = this.config.get<string>(
            CONFIG_NAMES.TIME_SEPARATOR_OFF,
            DEFAULT_VALUES.TIME_SEPARATOR_OFF
        );
        this.cachedTimeFormat = this.config.get<TimeFormat>(CONFIG_NAMES.TIME_FORMAT, DEFAULT_VALUES.TIME_FORMAT);
        const dayName = this.timeTracker.getCurrentDayName();
        const endStr = this.config.get<string>(`${dayName}.end`, '');
        this.cachedEndHasSeconds = /^\d{1,2}:\d{1,2}:\d{1,2}$/.test(String(endStr).trim());
    }

    private updateFrequencyFromFormat(): void {
        this.updateFrequency =
            this.cachedShowSeconds || this.cachedFlashTimeSeparators || this.cachedEndHasSeconds
                ? TIME_CONSTANTS.UPDATE_INTERVAL_WITH_SECONDS_MS
                : TIME_CONSTANTS.DEFAULT_UPDATE_INTERVAL_MS;
    }

    private formatTime(timeRemaining: TimeRemaining, format: TimeFormat): string {
        const { hours, minutes, seconds } = timeRemaining;
        const showHours = this.cachedShowHours;
        const showMinutes = this.cachedShowMinutes;
        const configEndHasSeconds = /^\d{1,2}:\d{1,2}:\d{1,2}$/.test(String(timeRemaining.end ?? '').trim());
        const showSeconds = this.cachedShowSeconds || configEndHasSeconds;
        const timeSeparator = this.cachedTimeSeparator;
        const flashTimeSeparators = this.cachedFlashTimeSeparators;
        const timeSeparatorOff = this.cachedTimeSeparatorOff;

        let separator = timeSeparator;
        if (flashTimeSeparators && format === TIME_FORMATS.TIME_FORMAT) {
            separator = this.flashState ? timeSeparator : timeSeparatorOff;
        }

        switch (format) {
            case TIME_FORMATS.HUMAN_READABLE: {
                const parts: string[] = [];
                if (showHours && hours > TIME_CONSTANTS.ZERO_TIME_VALUE) parts.push(`${hours}${TIME_DISPLAY.HOUR_SUFFIX}`);
                if (showMinutes && minutes > TIME_CONSTANTS.ZERO_TIME_VALUE) parts.push(`${minutes}${TIME_DISPLAY.MINUTE_SUFFIX}`);
                if (showSeconds && (seconds > TIME_CONSTANTS.ZERO_TIME_VALUE || parts.length === 0))
                    parts.push(`${seconds}${TIME_DISPLAY.SECOND_SUFFIX}`);
                if (parts.length === 0) {
                    if (showHours) return TIME_DISPLAY.ZERO_HOURS;
                    if (showMinutes) return TIME_DISPLAY.ZERO_MINUTES;
                    if (showSeconds) return TIME_DISPLAY.ZERO_SECONDS;
                    return TIME_DISPLAY.ZERO_MINUTES;
                }
                return parts.join(TIME_DISPLAY.HUMAN_READABLE_SEPARATOR);
            }
            case TIME_FORMATS.TIME_FORMAT: {
                const timeParts: string[] = [];
                if (showHours) {
                    timeParts.push(String(hours));
                }
                if (showMinutes) {
                    const minStr = showHours
                        ? String(minutes).padStart(TIME_DISPLAY.PADDING_LENGTH, TIME_DISPLAY.PADDING_CHAR)
                        : String(minutes);
                    timeParts.push(minStr);
                }
                if (showSeconds) {
                    const secStr =
                        showHours || showMinutes
                            ? String(seconds).padStart(TIME_DISPLAY.PADDING_LENGTH, TIME_DISPLAY.PADDING_CHAR)
                            : String(seconds);
                    timeParts.push(secStr);
                }
                if (timeParts.length === 0) {
                    return TIME_DISPLAY.ZERO_TIME;
                }
                return timeParts.join(separator);
            }
            default:
                return `${hours}${TIME_DISPLAY.HOUR_SUFFIX} ${minutes}${TIME_DISPLAY.MINUTE_SUFFIX}`;
        }
    }

    public update(): void {
        const timeRemaining = this.timeTracker.getTimeRemaining();
        const format = this.cachedTimeFormat;

        if (!timeRemaining || !timeRemaining.isWorkHours) {
            this.statusBarItem.hide();
            return;
        }

        const formattedTime = this.formatTime(timeRemaining, format);
        this.statusBarItem.text = `${STATUS_BAR.TEXT_PREFIX}${formattedTime}`;
        this.statusBarItem.tooltip = `${STATUS_BAR.TOOLTIP_PREFIX}${TimeTracker.formatTimeHHMMSS(timeRemaining.endTime)}`;
        this.statusBarItem.show();
    }

    private startUpdateInterval(): void {
        const useSingleInterval =
            this.updateFrequency === TIME_CONSTANTS.UPDATE_INTERVAL_WITH_SECONDS_MS &&
            this.cachedFlashTimeSeparators &&
            this.cachedTimeFormat === TIME_FORMATS.TIME_FORMAT;

        if (useSingleInterval) {
            this.flashState = true;
            this.updateInterval = setInterval(() => {
                this.flashState = !this.flashState;
                this.update();
            }, this.updateFrequency);
        } else {
            this.updateInterval = setInterval(() => {
                this.update();
            }, this.updateFrequency);
            if (this.cachedFlashTimeSeparators && this.cachedTimeFormat === TIME_FORMATS.TIME_FORMAT) {
                this.flashState = true;
                this.flashInterval = setInterval(() => {
                    this.flashState = !this.flashState;
                    this.update();
                }, TIME_CONSTANTS.FLASH_INTERVAL_MS);
            }
        }
    }

    public start(): void {
        this.update();
        this.startUpdateInterval();
    }

    public stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }
        this.statusBarItem.hide();
    }

    public refreshConfig(): void {
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
        this.refreshFormatCache();
        this.updateFrequencyFromFormat();
        const wasRunning = this.updateInterval !== null;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }
        if (wasRunning) {
            this.startUpdateInterval();
        }
        this.update();
    }

    public dispose(): void {
        this.stop();
        this.statusBarItem.dispose();
    }
}
