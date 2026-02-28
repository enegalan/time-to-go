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
        const dayName = this.getCurrentDayName(now);

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

    public formatTimeHHMMSS(date: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    public parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } {
        const str = String(timeStr ?? '').trim();

        const parse = (value?: string, fallback = TIME_CONSTANTS.ZERO_TIME_VALUE) =>
            parseInt(value ?? '', TIME_CONSTANTS.PARSE_INT_BASE) || fallback;

        const match = str.match(/^(\d{1,2})[:\uFF1A](\d{1,2})(?:[:\uFF1A](\d{1,2}))?$/);

        const parts = match
            ? [match[1], match[2], match[3]]
            : str.split(/[:\uFF1A]/);

        return {
            hours: parse(parts[0]),
            minutes: parse(parts[1]),
            seconds: parse(parts[2], TIME_CONSTANTS.ZERO_SECONDS),
        };
    }

    public getTimeRemaining(now?: Date): TimeRemaining | null {
        const date = now ?? new Date();
        const dayConfig = this.getCurrentDayConfig(date);
        if (!dayConfig) {
            return null;
        }

        const { hours: startHours, minutes: startMinutes, seconds: startSeconds } = this.parseTime(dayConfig.start);
        const { hours: endHours, minutes: endMinutes, seconds: endSeconds } = this.parseTime(dayConfig.end);

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
