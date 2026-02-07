import * as vscode from 'vscode';
import { CONFIG_NAMES, DAY_NAMES, TIME_CONSTANTS, DEFAULT_VALUES } from './constants';

export interface DayConfig {
    enabled: boolean;
    start: string;
    end: string;
}

export interface TimeRemaining {
    totalSeconds: number;
    hours: number;
    minutes: number;
    seconds: number;
    endTime: Date;
    isWorkHours: boolean;
    start?: string;
    end?: string;
}

export class TimeTracker {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
    }

    public getCurrentDayConfig(now?: Date): DayConfig | null {
        const date = now ?? new Date();
        const dayOfWeek = date.getDay();
        const dayName = DAY_NAMES[dayOfWeek];

        const enabled = this.config.get<boolean>(`${dayName}.enabled`, DEFAULT_VALUES.DAY_ENABLED);
        const start = this.config.get<string>(`${dayName}.start`, DEFAULT_VALUES.DAY_START_TIME);
        const end = this.config.get<string>(`${dayName}.end`, DEFAULT_VALUES.DAY_END_TIME);

        if (!enabled) {
            return null;
        }

        return { enabled, start, end };
    }

    public getCurrentDayName(now?: Date): string {
        const date = now ?? new Date();
        return DAY_NAMES[date.getDay()];
    }

    /** Formats a Date as HH:MM:SS from its local time components. */
    public static formatTimeHHMMSS(date: Date): string {
        const h = date.getHours();
        const m = date.getMinutes();
        const s = date.getSeconds();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    /** Parses HH:MM or HH:MM:SS (colon or full-width colon). */
    public static parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } {
        const str = String(timeStr ?? '').trim();
        const match = str.match(/^(\d{1,2})[:\uFF1A](\d{1,2})(?:[:\uFF1A](\d{1,2}))?$/);
        if (!match) {
            const fallback = str.split(/[:\uFF1A]/);
            const hours = parseInt(fallback[0], TIME_CONSTANTS.PARSE_INT_BASE) || TIME_CONSTANTS.ZERO_TIME_VALUE;
            const minutes = parseInt(fallback[1], TIME_CONSTANTS.PARSE_INT_BASE) || TIME_CONSTANTS.ZERO_TIME_VALUE;
            const seconds = fallback.length >= 3
                ? (parseInt(fallback[2], TIME_CONSTANTS.PARSE_INT_BASE) || TIME_CONSTANTS.ZERO_SECONDS)
                : TIME_CONSTANTS.ZERO_SECONDS;
            return { hours, minutes, seconds };
        }
        const hours = parseInt(match[1], TIME_CONSTANTS.PARSE_INT_BASE) || TIME_CONSTANTS.ZERO_TIME_VALUE;
        const minutes = parseInt(match[2], TIME_CONSTANTS.PARSE_INT_BASE) || TIME_CONSTANTS.ZERO_TIME_VALUE;
        const seconds = match[3] !== undefined
            ? (parseInt(match[3], TIME_CONSTANTS.PARSE_INT_BASE) || TIME_CONSTANTS.ZERO_SECONDS)
            : TIME_CONSTANTS.ZERO_SECONDS;
        return { hours, minutes, seconds };
    }

    public getTimeRemaining(now?: Date): TimeRemaining | null {
        const date = now ?? new Date();
        const dayConfig = this.getCurrentDayConfig(date);
        if (!dayConfig) {
            return null;
        }

        const { hours: startHours, minutes: startMinutes, seconds: startSeconds } = TimeTracker.parseTime(dayConfig.start);
        const { hours: endHours, minutes: endMinutes, seconds: endSeconds } = TimeTracker.parseTime(dayConfig.end);

        const startTime = new Date(date);
        startTime.setHours(startHours, startMinutes, startSeconds, TIME_CONSTANTS.ZERO_MILLISECONDS);

        const endTime = new Date(date);
        endTime.setHours(endHours, endMinutes, endSeconds, TIME_CONSTANTS.ZERO_MILLISECONDS);

        const isWorkHours = date >= startTime && date < endTime;
        const base = {
            totalSeconds: TIME_CONSTANTS.ZERO_TIME_VALUE,
            hours: TIME_CONSTANTS.ZERO_TIME_VALUE,
            minutes: TIME_CONSTANTS.ZERO_TIME_VALUE,
            seconds: TIME_CONSTANTS.ZERO_TIME_VALUE,
            endTime,
            isWorkHours,
            start: dayConfig.start,
            end: dayConfig.end
        };

        if (!isWorkHours) {
            return base;
        }

        const diffMs = endTime.getTime() - date.getTime();
        const totalSeconds = Math.floor(diffMs / TIME_CONSTANTS.MILLISECONDS_PER_SECOND);

        const hours = Math.floor(totalSeconds / TIME_CONSTANTS.SECONDS_PER_HOUR);
        const minutes = Math.floor((totalSeconds % TIME_CONSTANTS.SECONDS_PER_HOUR) / TIME_CONSTANTS.SECONDS_PER_MINUTE);
        const seconds = totalSeconds % TIME_CONSTANTS.SECONDS_PER_MINUTE;

        return {
            ...base,
            totalSeconds,
            hours,
            minutes,
            seconds,
            isWorkHours: true
        };
    }

    public isWorkHours(): boolean {
        const timeRemaining = this.getTimeRemaining();
        return timeRemaining !== null && timeRemaining.isWorkHours;
    }

    public getEndTime(now?: Date): Date | null {
        const timeRemaining = this.getTimeRemaining(now);
        return timeRemaining ? timeRemaining.endTime : null;
    }

    public refreshConfig(): void {
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
    }
}
