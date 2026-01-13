import * as vscode from 'vscode';
import { TimeTracker, TimeRemaining } from './timeTracker';
import {
    CONFIG_NAMES,
    TIME_CONSTANTS,
    DAY_NAMES,
    DEFAULT_VALUES,
    MESSAGES,
} from './constants';

interface PeriodicNotification {
    message: string;
    interval: number;
    days: string[];
}

export class Notifications {
    private timeTracker: TimeTracker;
    private config: vscode.WorkspaceConfiguration;
    private notificationSent: boolean = false;
    private endTimeNotificationSent: boolean = false;
    private checkInterval: NodeJS.Timeout | null = null;
    private periodicNotificationLastShown: Map<number, number> = new Map();

    constructor(timeTracker: TimeTracker) {
        this.timeTracker = timeTracker;
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
    }

    private shouldShowNotification(): boolean {
        return this.config.get<boolean>(CONFIG_NAMES.NOTIFICATIONS_ENABLED, DEFAULT_VALUES.NOTIFICATIONS_ENABLED);
    }

    private getNotificationMinutes(): number {
        return this.config.get<number>(CONFIG_NAMES.NOTIFICATION_MINUTES, DEFAULT_VALUES.NOTIFICATION_MINUTES);
    }

    public check(timeRemaining: TimeRemaining | null): void {
        if (!this.shouldShowNotification() || !timeRemaining || !timeRemaining.isWorkHours) {
            this.notificationSent = false;
            this.endTimeNotificationSent = false;
            return;
        }

        const notificationMinutes = this.getNotificationMinutes();
        const totalMinutes = timeRemaining.hours * TIME_CONSTANTS.MINUTES_PER_HOUR + timeRemaining.minutes;

        if (totalMinutes <= notificationMinutes && !this.notificationSent) {
            this.showNotification(timeRemaining, notificationMinutes);
            this.notificationSent = true;
        }

        if (timeRemaining.totalSeconds <= TIME_CONSTANTS.ZERO_TIME_VALUE && !this.endTimeNotificationSent) {
            this.showEndTimeNotification();
            this.endTimeNotificationSent = true;
        }
    }

    private showNotification(timeRemaining: TimeRemaining, minutes: number): void {
        const message = MESSAGES.NOTIFICATION_MINUTES_LEFT(minutes, timeRemaining.endTime.toLocaleTimeString());
        vscode.window.showInformationMessage(message);
    }

    private showEndTimeNotification(): void {
        vscode.window.showInformationMessage(MESSAGES.TIME_TO_GO);
    }

    private getCurrentDayName(): string {
        const now = new Date();
        const dayOfWeek = now.getDay();
        return DAY_NAMES[dayOfWeek];
    }

    private checkPeriodicNotifications(): void {
        const periodicNotifications = this.config.get<PeriodicNotification[]>(
            CONFIG_NAMES.PERIODIC_NOTIFICATIONS,
            []
        );
        if (!periodicNotifications || periodicNotifications.length === TIME_CONSTANTS.ZERO_TIME_VALUE) {
            return;
        }

        const currentDay = this.getCurrentDayName();
        const now = Date.now();

        periodicNotifications.forEach((notification, index) => {
            if (!notification.days || !notification.days.includes(currentDay)) {
                return;
            }

            const lastShown = this.periodicNotificationLastShown.get(index) || TIME_CONSTANTS.ZERO_TIME_VALUE;
            const intervalMs = notification.interval * TIME_CONSTANTS.MILLISECONDS_PER_SECOND;
            const timeSinceLastShown = now - lastShown;

            if (timeSinceLastShown >= intervalMs) {
                vscode.window.showInformationMessage(notification.message);
                this.periodicNotificationLastShown.set(index, now);
            }
        });
    }

    public start(): void {
        this.checkInterval = setInterval(() => {
            const timeRemaining = this.timeTracker.getTimeRemaining();
            this.check(timeRemaining);
            this.checkPeriodicNotifications();
        }, TIME_CONSTANTS.NOTIFICATION_CHECK_INTERVAL_MS);
    }

    public stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.notificationSent = false;
        this.endTimeNotificationSent = false;
    }

    public refreshConfig(): void {
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
        this.notificationSent = false;
        this.endTimeNotificationSent = false;
        this.periodicNotificationLastShown.clear();
    }

    public dispose(): void {
        this.stop();
    }
}
