import * as vscode from 'vscode';

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
        this.config = vscode.workspace.getConfiguration('timeToGo');
    }

    public getCurrentDayConfig(): DayConfig | null {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];

        const enabled = this.config.get<boolean>(`${dayName}.enabled`, false);
        const start = this.config.get<string>(`${dayName}.start`, '09:00');
        const end = this.config.get<string>(`${dayName}.end`, '18:00');

        if (!enabled) {
            return null;
        }

        return { enabled, start, end };
    }

    public parseTime(timeStr: string): { hours: number; minutes: number } {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
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
        startTime.setHours(startHours, startMinutes, 0, 0);

        const endTime = new Date(now);
        endTime.setHours(endHours, endMinutes, 0, 0);

        const isWorkHours = now >= startTime && now < endTime;

        if (!isWorkHours) {
            return {
                totalSeconds: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                endTime,
                isWorkHours: false
            };
        }

        const diffMs = endTime.getTime() - now.getTime();
        const totalSeconds = Math.floor(diffMs / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

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
        endTime.setHours(endHours, endMinutes, 0, 0);

        return endTime;
    }

    public refreshConfig(): void {
        this.config = vscode.workspace.getConfiguration('timeToGo');
    }
}
