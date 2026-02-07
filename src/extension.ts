import * as vscode from 'vscode';
import { TimeTracker } from './timeTracker';
import { StatusBar } from './statusBar';
import { Notifications } from './notifications';
import { COMMANDS, CONFIG_NAMES, MESSAGES } from './constants';

let statusBar: StatusBar | null = null;
let notifications: Notifications | null = null;
let timeTracker: TimeTracker | null = null;
let isEnabled: boolean = true;

export function activate(context: vscode.ExtensionContext) {
    console.log(MESSAGES.EXTENSION_ACTIVATED);

    isEnabled = context.globalState.get<boolean>('enabled', true);

    timeTracker = new TimeTracker();
    statusBar = new StatusBar(timeTracker);
    notifications = new Notifications(timeTracker);

    if (isEnabled) {
        statusBar.start();
        notifications.start();
    }

    const configureCommand = vscode.commands.registerCommand(COMMANDS.CONFIGURE, () => {
        vscode.commands.executeCommand(COMMANDS.OPEN_SETTINGS, CONFIG_NAMES.ROOT);
    });

    const toggleCommand = vscode.commands.registerCommand(COMMANDS.TOGGLE, () => {
        isEnabled = !isEnabled;
        void context.globalState.update('enabled', isEnabled);
        if (isEnabled) {
            if (statusBar) statusBar.start();
            if (notifications) notifications.start();
            vscode.window.showInformationMessage(MESSAGES.ENABLED);
        } else {
            if (statusBar) statusBar.stop();
            if (notifications) notifications.stop();
            vscode.window.showInformationMessage(MESSAGES.DISABLED);
        }
    });

    const statusCommand = vscode.commands.registerCommand(COMMANDS.STATUS, () => {
        if (!timeTracker) {
            vscode.window.showInformationMessage(MESSAGES.NOT_INITIALIZED);
            return;
        }

        const timeRemaining = timeTracker.getTimeRemaining();

        if (!timeRemaining) {
            vscode.window.showInformationMessage(MESSAGES.NOT_CONFIGURED_DAY);
            return;
        }

        if (!timeRemaining.isWorkHours) {
            const schedule =
                timeRemaining.start !== undefined && timeRemaining.end !== undefined
                    ? `${timeRemaining.start} - ${timeRemaining.end}`
                    : '';
            vscode.window.showInformationMessage(`${MESSAGES.OUTSIDE_WORK_HOURS}${schedule}`);
            return;
        }

        const { hours, minutes, seconds } = timeRemaining;
        const message = `${MESSAGES.TIME_REMAINING}${hours}h ${minutes}m ${seconds}s${MESSAGES.END_TIME_LABEL}${timeRemaining.endTime.toLocaleTimeString()}`;
        vscode.window.showInformationMessage(message);
    });

    context.subscriptions.push(configureCommand);
    context.subscriptions.push(toggleCommand);
    context.subscriptions.push(statusCommand);

    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(CONFIG_NAMES.ROOT)) {
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
    timeTracker = null;
}
