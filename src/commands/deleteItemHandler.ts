import * as vscode from 'vscode';
import * as fs from 'fs';
import { NoteItem, NoteExplorerProvider } from '../noteExplorerProvider';

export async function deleteItemHandler(item: NoteItem | undefined, noteExplorerProvider?: NoteExplorerProvider): Promise<void> {
    if (!item) {
        vscode.window.showWarningMessage('Select an item to delete from the Note Explorer.');
        return;
    }
    const confirmation = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: `Are you sure you want to delete "${item.label}"? This action cannot be undone.`,
    });

    if (confirmation === 'Yes') {
        try {
            if (item.itemType === 'file') {
                fs.unlinkSync(item.filePath);
            } else if (item.itemType === 'directory') {
                fs.rmSync(item.filePath, { recursive: true, force: true });
            }
            noteExplorerProvider?.refresh();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to delete: ${error.message}`);
        }
    }
} 