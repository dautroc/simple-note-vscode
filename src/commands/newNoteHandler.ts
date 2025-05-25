import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NoteItem, NoteExplorerProvider } from '../noteExplorerProvider'; // Adjusted path
import { getNotesPath, getDefaultExtension } from '../utils/configUtils'; // Adjusted path

export async function newNoteHandler(item?: NoteItem, noteExplorerProvider?: NoteExplorerProvider): Promise<void> {
    const notesRootPath = getNotesPath();
    if (!notesRootPath) {
        vscode.window.showErrorMessage('Simple Note: Notes path not set.');
        return;
    }

    const parentPath = item && item.itemType === 'directory' ? item.filePath : notesRootPath;

    let fileName = await vscode.window.showInputBox({ prompt: 'Enter the name for the new note (extension will be added if not provided)' });
    if (fileName) {
        const defaultExtension = getDefaultExtension();

        if (defaultExtension && !path.extname(fileName)) {
            fileName = `${fileName}.${defaultExtension}`;
        } else if (defaultExtension && path.extname(fileName) === '.') {
            fileName = `${fileName}${defaultExtension}`;
        }

        const filePath = path.join(parentPath, fileName);

        if (fs.existsSync(filePath)) {
            vscode.window.showErrorMessage(`Note already exists: ${filePath}`);
            return;
        }

        try {
            fs.writeFileSync(filePath, '');
            noteExplorerProvider?.refresh(); // Use optional chaining as provider might not always be passed
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            await vscode.window.showTextDocument(doc);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create note: ${error.message}`);
        }
    }
} 