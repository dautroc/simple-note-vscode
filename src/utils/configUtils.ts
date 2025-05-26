import * as vscode from 'vscode';

export function getNotesPath(): string | undefined {
    return vscode.workspace.getConfiguration('simpleNote').get<string>('notesPath');
}

export function getTemplatesPath(): string | undefined {
    return vscode.workspace.getConfiguration('simpleNote').get<string>('templatesPath');
}

export function getDefaultExtension(): string {
    return vscode.workspace.getConfiguration('simpleNote').get<string>('defaultExtension', 'md');
} 

export function getDefaultTemplatePath(): string | undefined {
    return vscode.workspace.getConfiguration('simpleNote').get<string>('defaultTemplatePath');
}

export function getJournalTemplatePath(): string | undefined {
    return vscode.workspace.getConfiguration('simpleNote').get<string>('journalTemplatePath');
} 