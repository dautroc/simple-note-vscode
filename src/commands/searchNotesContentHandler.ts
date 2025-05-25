import * as vscode from 'vscode';
import { getNotesPath } from '../utils/configUtils';

export async function searchNotesContentHandler(): Promise<void> {
    const notesRootPath = getNotesPath();

    if (!notesRootPath) {
        vscode.window.showErrorMessage('Simple Note: Notes path not set. Please configure "simpleNote.notesPath".');
        return;
    }

    try {
        // Execute VS Code's built-in Find in Files command
        // The command will open the search view with 'filesToInclude' pre-filled.
        // The user can then type their search query directly in the search panel.
        await vscode.commands.executeCommand('workbench.action.findInFiles', {
            filesToInclude: notesRootPath,
            triggerSearch: false,
        });

    } catch (error: any) {
        vscode.window.showErrorMessage(`Error opening search panel: ${error.message}`);
    }
} 