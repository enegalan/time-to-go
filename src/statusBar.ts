import * as vscode from 'vscode';
import { TimeTracker, TimeRemaining } from './timeTracker';

export type TimeFormat = 'human-readable' | 'human-readable-no-seconds' | 'time-format' | 'time-format-no-seconds';

export class StatusBar {
    private statusBarItem: vscode.StatusBarItem;
    private timeTracker: TimeTracker;
    private config: vscode.WorkspaceConfiguration;
    private updateInterval: NodeJS.Timeout | null = null;
    private updateFrequency: number = 60000;

    constructor(timeTracker: TimeTracker) {
        this.timeTracker = timeTracker;
        this.config = vscode.workspace.getConfiguration('timeToGo');
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'timeToGo.status';
        this.updateFrequencyFromFormat();
    }

    private updateFrequencyFromFormat(): void {
        const format = this.config.get<TimeFormat>('timeFormat', 'human-readable-no-seconds');
        const includesSeconds = format === 'human-readable' || format === 'time-format';
        this.updateFrequency = includesSeconds ? 1000 : 60000;
    }

    private formatTime(timeRemaining: TimeRemaining, format: TimeFormat): string {
        const { hours, minutes, seconds } = timeRemaining;

        switch (format) {
            case 'human-readable':
                const parts: string[] = [];
                if (hours > 0) parts.push(`${hours}h`);
                if (minutes > 0) parts.push(`${minutes}m`);
                if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
                return parts.join(' ');

            case 'human-readable-no-seconds':
                const partsNoSec: string[] = [];
                if (hours > 0) partsNoSec.push(`${hours}h`);
                if (minutes > 0) partsNoSec.push(`${minutes}m`);
                return partsNoSec.length > 0 ? partsNoSec.join(' ') : '0m';

            case 'time-format':
                return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            case 'time-format-no-seconds':
                return `${hours}:${String(minutes).padStart(2, '0')}`;

            default:
                return `${hours}h ${minutes}m`;
        }
    }

    private getStatusBarColor(timeRemaining: TimeRemaining): string {
        const totalHours = timeRemaining.hours + timeRemaining.minutes / 60;
        
        if (totalHours > 2) {
            return 'statusBar.foreground';
        } else if (totalHours > 1) {
            return 'statusBarItem.warningForeground';
        } else {
            return 'statusBarItem.errorForeground';
        }
    }

    public update(): void {
        const timeRemaining = this.timeTracker.getTimeRemaining();
        const format = this.config.get<TimeFormat>('timeFormat', 'human-readable-no-seconds');

        if (!timeRemaining || !timeRemaining.isWorkHours) {
            this.statusBarItem.hide();
            return;
        }

        const formattedTime = this.formatTime(timeRemaining, format);
        this.statusBarItem.text = `$(clock) Time to go: ${formattedTime}`;
        this.statusBarItem.color = this.getStatusBarColor(timeRemaining);
        this.statusBarItem.tooltip = `End time: ${timeRemaining.endTime.toLocaleTimeString()}`;
        this.statusBarItem.show();
    }

    public start(): void {
        this.update();
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.updateFrequency);
    }

    public stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.statusBarItem.hide();
    }

    public refreshConfig(): void {
        this.config = vscode.workspace.getConfiguration('timeToGo');
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
