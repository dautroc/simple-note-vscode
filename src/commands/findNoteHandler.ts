import * as vscode from 'vscode';
import { getNotesPath } from '../utils/configUtils';
import * as path from 'path'; // For path.sep

export async function findNoteHandler(): Promise<void> {
    const notesRootPath = getNotesPath();

    if (!notesRootPath) {
        vscode.window.showErrorMessage('Simple Note: Notes path not set. Please configure "simpleNote.notesPath".');
        return;
    }

    try {
        // Ensure the path ends with a separator to hint to Quick Open it's a directory filter.
        // VS Code's Quick Open is generally good at handling paths, and an absolute path should work.
        let quickOpenQuery = notesRootPath;
        if (!quickOpenQuery.endsWith(path.sep)) {
            quickOpenQuery += path.sep;
        }

        // Execute VS Code's built-in Quick Open command (Go to File)
        // Pre-filling with the notes path (e.g., "/path/to/your/notes/") 
        // will filter the Quick Open list to that directory.
        await vscode.commands.executeCommand('workbench.action.quickOpen', quickOpenQuery);
        // The user then types the rest of the filename and selects it.
        // VS Code handles opening the selected file.

    } catch (error: any) {
        vscode.window.showErrorMessage(`Error opening Quick Open for notes: ${error.message}`);
    }
} 