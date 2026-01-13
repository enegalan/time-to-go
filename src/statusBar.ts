import * as vscode from 'vscode';
import { TimeTracker, TimeRemaining } from './timeTracker';
import {
    CONFIG_NAMES,
    TIME_FORMATS,
    TIME_CONSTANTS,
    STATUS_BAR,
    TIME_DISPLAY,
    COLOR_THRESHOLDS,
    STATUS_BAR_COLORS,
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

    constructor(timeTracker: TimeTracker) {
        this.timeTracker = timeTracker;
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            STATUS_BAR.PRIORITY
        );
        this.statusBarItem.command = COMMANDS.STATUS;
        this.updateFrequencyFromFormat();
    }

    private updateFrequencyFromFormat(): void {
        const showSeconds = this.config.get<boolean>(CONFIG_NAMES.SHOW_SECONDS, DEFAULT_VALUES.SHOW_SECONDS);
        const flashTimeSeparators = this.config.get<boolean>(
            CONFIG_NAMES.FLASH_TIME_SEPARATORS,
            DEFAULT_VALUES.FLASH_TIME_SEPARATORS
        );
        this.updateFrequency =
            showSeconds || flashTimeSeparators
                ? TIME_CONSTANTS.UPDATE_INTERVAL_WITH_SECONDS_MS
                : TIME_CONSTANTS.DEFAULT_UPDATE_INTERVAL_MS;
    }

    private formatTime(timeRemaining: TimeRemaining, format: TimeFormat): string {
        const { hours, minutes, seconds } = timeRemaining;
        const showHours = this.config.get<boolean>(CONFIG_NAMES.SHOW_HOURS, DEFAULT_VALUES.SHOW_HOURS);
        const showMinutes = this.config.get<boolean>(CONFIG_NAMES.SHOW_MINUTES, DEFAULT_VALUES.SHOW_MINUTES);
        const showSeconds = this.config.get<boolean>(CONFIG_NAMES.SHOW_SECONDS, DEFAULT_VALUES.SHOW_SECONDS);
        const timeSeparator = this.config.get<string>(CONFIG_NAMES.TIME_SEPARATOR, DEFAULT_VALUES.TIME_SEPARATOR);
        const flashTimeSeparators = this.config.get<boolean>(
            CONFIG_NAMES.FLASH_TIME_SEPARATORS,
            DEFAULT_VALUES.FLASH_TIME_SEPARATORS
        );
        const timeSeparatorOff = this.config.get<string>(
            CONFIG_NAMES.TIME_SEPARATOR_OFF,
            DEFAULT_VALUES.TIME_SEPARATOR_OFF
        );

        let separator = timeSeparator;
        if (flashTimeSeparators && format === TIME_FORMATS.TIME_FORMAT) {
            separator = this.flashState ? timeSeparator : timeSeparatorOff;
        }

        switch (format) {
            case TIME_FORMATS.HUMAN_READABLE:
                const parts: string[] = [];
                if (showHours && hours > TIME_CONSTANTS.ZERO_TIME_VALUE) parts.push(`${hours}${TIME_DISPLAY.HOUR_SUFFIX}`);
                if (showMinutes && minutes > TIME_CONSTANTS.ZERO_TIME_VALUE) parts.push(`${minutes}${TIME_DISPLAY.MINUTE_SUFFIX}`);
                if (showSeconds && (seconds > TIME_CONSTANTS.ZERO_TIME_VALUE || parts.length === TIME_CONSTANTS.ZERO_TIME_VALUE))
                    parts.push(`${seconds}${TIME_DISPLAY.SECOND_SUFFIX}`);
                if (parts.length === TIME_CONSTANTS.ZERO_TIME_VALUE) {
                    if (showHours) return TIME_DISPLAY.ZERO_HOURS;
                    if (showMinutes) return TIME_DISPLAY.ZERO_MINUTES;
                    if (showSeconds) return TIME_DISPLAY.ZERO_SECONDS;
                    return TIME_DISPLAY.ZERO_MINUTES;
                }
                return parts.join(TIME_DISPLAY.HUMAN_READABLE_SEPARATOR);

            case TIME_FORMATS.TIME_FORMAT:
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
                if (timeParts.length === TIME_CONSTANTS.ZERO_TIME_VALUE) {
                    return TIME_DISPLAY.ZERO_TIME;
                }
                return timeParts.join(separator);

            default:
                return `${hours}${TIME_DISPLAY.HOUR_SUFFIX} ${minutes}${TIME_DISPLAY.MINUTE_SUFFIX}`;
        }
    }

    private getStatusBarColor(timeRemaining: TimeRemaining): string {
        const totalHours = timeRemaining.hours + timeRemaining.minutes / TIME_CONSTANTS.MINUTES_PER_HOUR;

        if (totalHours > COLOR_THRESHOLDS.NORMAL_HOURS) {
            return STATUS_BAR_COLORS.NORMAL;
        } else if (totalHours > COLOR_THRESHOLDS.WARNING_HOURS) {
            return STATUS_BAR_COLORS.WARNING;
        } else {
            return STATUS_BAR_COLORS.ERROR;
        }
    }

    public update(): void {
        const timeRemaining = this.timeTracker.getTimeRemaining();
        const format = this.config.get<TimeFormat>(CONFIG_NAMES.TIME_FORMAT, DEFAULT_VALUES.TIME_FORMAT);

        if (!timeRemaining || !timeRemaining.isWorkHours) {
            this.statusBarItem.hide();
            return;
        }

        const formattedTime = this.formatTime(timeRemaining, format);
        this.statusBarItem.text = `${STATUS_BAR.TEXT_PREFIX}${formattedTime}`;
        this.statusBarItem.color = this.getStatusBarColor(timeRemaining);
        this.statusBarItem.tooltip = `${STATUS_BAR.TOOLTIP_PREFIX}${timeRemaining.endTime.toLocaleTimeString()}`;
        this.statusBarItem.show();
    }

    public start(): void {
        this.update();
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.updateFrequency);

        const flashTimeSeparators = this.config.get<boolean>(
            CONFIG_NAMES.FLASH_TIME_SEPARATORS,
            DEFAULT_VALUES.FLASH_TIME_SEPARATORS
        );
        const format = this.config.get<TimeFormat>(CONFIG_NAMES.TIME_FORMAT, DEFAULT_VALUES.TIME_FORMAT);
        if (flashTimeSeparators && format === TIME_FORMATS.TIME_FORMAT) {
            this.flashState = true;
            this.flashInterval = setInterval(() => {
                this.flashState = !this.flashState;
                this.update();
            }, TIME_CONSTANTS.FLASH_INTERVAL_MS);
        }
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
        this.updateFrequencyFromFormat();
        if (this.updateInterval) {
            this.stop();
            this.start();
        }
    }

    public dispose(): void {
        this.stop();
        this.statusBarItem.dispose();
    }
}
