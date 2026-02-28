import * as vscode from 'vscode';
import { CONFIG_NAMES } from './constants';

export function getExtensionConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(CONFIG_NAMES.ROOT);
}
