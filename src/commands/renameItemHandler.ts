import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NoteItem, NoteExplorerProvider } from '../noteExplorerProvider';

export async function renameItemHandler(item: NoteItem | undefined, noteExplorerProvider?: NoteExplorerProvider): Promise<void> {
    if (!item) {
        vscode.window.showWarningMessage('Select an item to rename from the Note Explorer.');
        return;
    }
    const oldPath = item.filePath;
    const newName = await vscode.window.showInputBox({ value: item.label, prompt: 'Enter the new name' });
    if (newName && newName !== item.label) {
        const newPath = path.join(path.dirname(oldPath), newName);
        if (fs.existsSync(newPath)) {
            vscode.window.showErrorMessage(`An item with the name "${newName}" already exists in this location.`);
            return;
        }
        try {
            fs.renameSync(oldPath, newPath);
            noteExplorerProvider?.refresh();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to rename: ${error.message}`);
        }
    }
} 