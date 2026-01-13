import * as vscode from 'vscode';
import { CONFIG_NAMES, DAY_NAMES, TIME_CONSTANTS, DEFAULT_VALUES, TIME_DISPLAY } from './constants';

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
}

export class TimeTracker {
    private config: vscode.WorkspaceConfiguration;

    constructor() {
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
    }

    public getCurrentDayConfig(): DayConfig | null {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayName = DAY_NAMES[dayOfWeek];

        const enabled = this.config.get<boolean>(`${dayName}.enabled`, DEFAULT_VALUES.DAY_ENABLED);
        const start = this.config.get<string>(`${dayName}.start`, DEFAULT_VALUES.DAY_START_TIME);
        const end = this.config.get<string>(`${dayName}.end`, DEFAULT_VALUES.DAY_END_TIME);

        if (!enabled) {
            return null;
        }

        return { enabled, start, end };
    }

    public parseTime(timeStr: string): { hours: number; minutes: number } {
        const parts = timeStr.split(TIME_DISPLAY.DEFAULT_TIME_SEPARATOR);
        const hours = parseInt(parts[0], TIME_CONSTANTS.PARSE_INT_BASE);
        const minutes = parseInt(parts[1], TIME_CONSTANTS.PARSE_INT_BASE);
        return { hours, minutes };
    }

    public getTimeRemaining(): TimeRemaining | null {
        const dayConfig = this.getCurrentDayConfig();
        if (!dayConfig) {
            return null;
        }

        const now = new Date();
        const { hours: startHours, minutes: startMinutes } = this.parseTime(dayConfig.start);
        const { hours: endHours, minutes: endMinutes } = this.parseTime(dayConfig.end);

        const startTime = new Date(now);
        startTime.setHours(startHours, startMinutes, TIME_CONSTANTS.ZERO_SECONDS, TIME_CONSTANTS.ZERO_MILLISECONDS);

        const endTime = new Date(now);
        endTime.setHours(endHours, endMinutes, TIME_CONSTANTS.ZERO_SECONDS, TIME_CONSTANTS.ZERO_MILLISECONDS);

        const isWorkHours = now >= startTime && now < endTime;

        if (!isWorkHours) {
            return {
                totalSeconds: TIME_CONSTANTS.ZERO_TIME_VALUE,
                hours: TIME_CONSTANTS.ZERO_TIME_VALUE,
                minutes: TIME_CONSTANTS.ZERO_TIME_VALUE,
                seconds: TIME_CONSTANTS.ZERO_TIME_VALUE,
                endTime,
                isWorkHours: false
            };
        }

        const diffMs = endTime.getTime() - now.getTime();
        const totalSeconds = Math.floor(diffMs / TIME_CONSTANTS.MILLISECONDS_PER_SECOND);

        const hours = Math.floor(totalSeconds / TIME_CONSTANTS.SECONDS_PER_HOUR);
        const minutes = Math.floor((totalSeconds % TIME_CONSTANTS.SECONDS_PER_HOUR) / TIME_CONSTANTS.SECONDS_PER_MINUTE);
        const seconds = totalSeconds % TIME_CONSTANTS.SECONDS_PER_MINUTE;

        return {
            totalSeconds,
            hours,
            minutes,
            seconds,
            endTime,
            isWorkHours: true
        };
    }

    public isWorkHours(): boolean {
        const timeRemaining = this.getTimeRemaining();
        return timeRemaining !== null && timeRemaining.isWorkHours;
    }

    public getEndTime(): Date | null {
        const dayConfig = this.getCurrentDayConfig();
        if (!dayConfig) {
            return null;
        }

        const now = new Date();
        const { hours: endHours, minutes: endMinutes } = this.parseTime(dayConfig.end);
        const endTime = new Date(now);
        endTime.setHours(endHours, endMinutes, TIME_CONSTANTS.ZERO_SECONDS, TIME_CONSTANTS.ZERO_MILLISECONDS);

        return endTime;
    }

    public refreshConfig(): void {
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
    }
}
