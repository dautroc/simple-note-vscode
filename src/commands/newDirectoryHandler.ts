import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NoteItem, NoteExplorerProvider } from '../noteExplorerProvider';
import { getNotesPath } from '../utils/configUtils';

export async function newDirectoryHandler(item?: NoteItem, noteExplorerProvider?: NoteExplorerProvider): Promise<void> {
    const notesRootPath = getNotesPath();
    if (!notesRootPath) {
        vscode.window.showErrorMessage('Simple Note: Notes path not set.');
        return;
    }

    const parentPath = item && item.itemType === 'directory' ? item.filePath : notesRootPath;

    const dirName = await vscode.window.showInputBox({ prompt: 'Enter the name for the new directory' });
    if (dirName) {
        const dirPath = path.join(parentPath, dirName);
        if (fs.existsSync(dirPath)) {
            vscode.window.showErrorMessage(`Directory already exists: ${dirPath}`);
            return;
        }
        try {
            fs.mkdirSync(dirPath);
            noteExplorerProvider?.refresh();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create directory: ${error.message}`);
        }
    }
} 