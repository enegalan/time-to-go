import * as vscode from 'vscode';
import { TimeTracker, TimeRemaining } from './timeTracker';

export class Notifications {
    private timeTracker: TimeTracker;
    private config: vscode.WorkspaceConfiguration;
    private notificationSent: boolean = false;
    private endTimeNotificationSent: boolean = false;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(timeTracker: TimeTracker) {
        this.timeTracker = timeTracker;
        this.config = vscode.workspace.getConfiguration('timeToGo');
    }

    private shouldShowNotification(): boolean {
        return this.config.get<boolean>('notificationsEnabled', true);
    }

    private getNotificationMinutes(): number {
        return this.config.get<number>('notificationMinutes', 30);
    }

    public check(timeRemaining: TimeRemaining | null): void {
        if (!this.shouldShowNotification() || !timeRemaining || !timeRemaining.isWorkHours) {
            this.notificationSent = false;
            this.endTimeNotificationSent = false;
            return;
        }

        const notificationMinutes = this.getNotificationMinutes();
        const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes;

        if (totalMinutes <= notificationMinutes && !this.notificationSent) {
            this.showNotification(timeRemaining, notificationMinutes);
            this.notificationSent = true;
        }

        if (timeRemaining.totalSeconds <= 0 && !this.endTimeNotificationSent) {
            this.showEndTimeNotification();
            this.endTimeNotificationSent = true;
        }
    }

    private showNotification(timeRemaining: TimeRemaining, minutes: number): void {
        const message = `⏰ You have ${minutes} minutes left to leave (${timeRemaining.endTime.toLocaleTimeString()})`;
        vscode.window.showInformationMessage(message);
    }

    private showEndTimeNotification(): void {
        const message = '🎉 Time to go!';
        vscode.window.showInformationMessage(message);
    }

    public start(): void {
        this.checkInterval = setInterval(() => {
            const timeRemaining = this.timeTracker.getTimeRemaining();
            this.check(timeRemaining);
        }, 60000);
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
        this.config = vscode.workspace.getConfiguration('timeToGo');
        this.notificationSent = false;
        this.endTimeNotificationSent = false;
    }

    public dispose(): void {
        this.stop();
    }
}
