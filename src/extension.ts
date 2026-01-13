import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { StatusBar } from './statusBar';
import { Notifications } from './notifications';

let statusBar: StatusBar | null = null;
let notifications: Notifications | null = null;
let timeTracker: TimeTracker | null = null;
let isEnabled: boolean = true;

export function activate(context: vscode.ExtensionContext) {
    console.log('Time to Go extension activated');

    timeTracker = new TimeTracker();
    statusBar = new StatusBar(timeTracker);
    notifications = new Notifications(timeTracker);

    if (isEnabled) {
        statusBar.start();
        notifications.start();
    }

    const configureCommand = vscode.commands.registerCommand('timeToGo.configure', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'timeToGo');
    });

    const toggleCommand = vscode.commands.registerCommand('timeToGo.toggle', () => {
        isEnabled = !isEnabled;
        if (isEnabled) {
            if (statusBar) statusBar.start();
            if (notifications) notifications.start();
            vscode.window.showInformationMessage('Time to Go enabled');
        } else {
            if (statusBar) statusBar.stop();
            if (notifications) notifications.stop();
            vscode.window.showInformationMessage('Time to Go disabled');
        }
    });

    const statusCommand = vscode.commands.registerCommand('timeToGo.status', () => {
        if (!timeTracker) {
            vscode.window.showInformationMessage('Time to Go is not initialized');
            return;
        }

        const timeRemaining = timeTracker.getTimeRemaining();
        const dayConfig = timeTracker.getCurrentDayConfig();

        if (!dayConfig) {
            vscode.window.showInformationMessage('Today is not a configured work day');
            return;
        }

        if (!timeRemaining || !timeRemaining.isWorkHours) {
            const endTime = timeTracker.getEndTime();
            if (endTime) {
                vscode.window.showInformationMessage(
                    `Outside work hours. Today's schedule: ${dayConfig.start} - ${dayConfig.end}`
                );
            } else {
                vscode.window.showInformationMessage('No schedule configured for today');
            }
            return;
        }

        const { hours, minutes, seconds } = timeRemaining;
        const message = `Time remaining: ${hours}h ${minutes}m ${seconds}s\nEnd time: ${timeRemaining.endTime.toLocaleTimeString()}`;
        vscode.window.showInformationMessage(message);
    });

    context.subscriptions.push(configureCommand);
    context.subscriptions.push(toggleCommand);
    context.subscriptions.push(statusCommand);

    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('timeToGo')) {
            if (timeTracker) timeTracker.refreshConfig();
            if (statusBar) statusBar.refreshConfig();
            if (notifications) notifications.refreshConfig();
        }
    });

    context.subscriptions.push({
        dispose: () => {
            if (statusBar) statusBar.dispose();
            if (notifications) notifications.dispose();
        }
    });
}

export function deactivate() {
    if (statusBar) {
        statusBar.dispose();
        statusBar = null;
    }
    if (notifications) {
        notifications.dispose();
        notifications = null;
    }
    if (timeTracker) {
        timeTracker = null;
    }
}
