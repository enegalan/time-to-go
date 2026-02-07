import * as vscode from 'vscode';
import { TimeTracker, TimeRemaining } from './timeTracker';
import {
    CONFIG_NAMES,
    TIME_CONSTANTS,
    DEFAULT_VALUES,
    MESSAGES,
    TIME_DISPLAY,
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
    private wasInWorkHours: boolean = false;
    private cachedPeriodicNotifications: PeriodicNotification[] = [];

    constructor(timeTracker: TimeTracker) {
        this.timeTracker = timeTracker;
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
        this.refreshPeriodicNotificationsCache();
    }

    private shouldShowNotification(): boolean {
        return this.config.get<boolean>(CONFIG_NAMES.NOTIFICATIONS_ENABLED, DEFAULT_VALUES.NOTIFICATIONS_ENABLED);
    }

    private getNotificationMinutes(): number {
        return this.config.get<number>(CONFIG_NAMES.NOTIFICATION_MINUTES, DEFAULT_VALUES.NOTIFICATION_MINUTES);
    }

    private refreshPeriodicNotificationsCache(): void {
        const value = this.config.get<PeriodicNotification[]>(CONFIG_NAMES.PERIODIC_NOTIFICATIONS, []);
        this.cachedPeriodicNotifications = Array.isArray(value) ? value : [];
    }

    public check(timeRemaining: TimeRemaining | null): void {
        if (!this.shouldShowNotification()) {
            this.notificationSent = false;
            this.endTimeNotificationSent = false;
            this.wasInWorkHours = false;
            return;
        }

        if (!timeRemaining) {
            this.notificationSent = false;
            this.endTimeNotificationSent = false;
            this.wasInWorkHours = false;
            return;
        }

        const isCurrentlyInWorkHours = timeRemaining.isWorkHours;
        const transitionedFromWorkHours = this.wasInWorkHours && !isCurrentlyInWorkHours;

        if (transitionedFromWorkHours && !this.endTimeNotificationSent) {
            this.showEndTimeNotification();
            this.endTimeNotificationSent = true;
        }

        if (!isCurrentlyInWorkHours) {
            this.notificationSent = false;
            this.wasInWorkHours = false;
            return;
        }

        this.wasInWorkHours = true;

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
        const endDisplay = timeRemaining.end ?? timeRemaining.endTime.toLocaleTimeString(undefined, TIME_DISPLAY.END_TIME_FORMAT_OPTIONS);
        const message = MESSAGES.NOTIFICATION_MINUTES_LEFT(minutes, endDisplay);
        vscode.window.showInformationMessage(message);
    }

    private showEndTimeNotification(): void {
        vscode.window.showInformationMessage(MESSAGES.TIME_TO_GO);
    }

    private checkPeriodicNotifications(): void {
        const periodicNotifications = this.cachedPeriodicNotifications;
        if (periodicNotifications.length === 0) {
            return;
        }

        const currentDay = this.timeTracker.getCurrentDayName();
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

    private getCheckIntervalMs(): number {
        const periodicNotifications = this.cachedPeriodicNotifications;
        if (periodicNotifications.length === 0) {
            return TIME_CONSTANTS.NOTIFICATION_CHECK_INTERVAL_MS;
        }
        const minIntervalSec = Math.min(...periodicNotifications.map((n) => n.interval));
        const minIntervalMs = minIntervalSec * TIME_CONSTANTS.MILLISECONDS_PER_SECOND;
        const minCheckMs = 1000;
        return Math.min(TIME_CONSTANTS.NOTIFICATION_CHECK_INTERVAL_MS, Math.max(minCheckMs, minIntervalMs));
    }

    public start(): void {
        this.refreshPeriodicNotificationsCache();
        const checkIntervalMs = this.getCheckIntervalMs();
        this.checkInterval = setInterval(() => {
            const timeRemaining = this.timeTracker.getTimeRemaining();
            this.check(timeRemaining);
            this.checkPeriodicNotifications();
        }, checkIntervalMs);
    }

    public stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.notificationSent = false;
        this.endTimeNotificationSent = false;
        this.wasInWorkHours = false;
    }

    public refreshConfig(): void {
        this.config = vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
        this.refreshPeriodicNotificationsCache();
        this.notificationSent = false;
        this.endTimeNotificationSent = false;
        this.wasInWorkHours = false;
        this.periodicNotificationLastShown.clear();
    }

    public dispose(): void {
        this.stop();
    }
}
