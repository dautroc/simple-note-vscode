import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getNotesPath } from '../utils/configUtils';

interface FoundNote {
    label: string; // Filename or relative path
    filePath: string; // Absolute path
    description?: string; // Could be the sub-folder path
}

// Recursive function to find all files in a directory
async function findAllFiles(dirPath: string, notesRootPath: string, fileList: FoundNote[] = []): Promise<FoundNote[]> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            await findAllFiles(fullPath, notesRootPath, fileList);
        } else if (entry.isFile()) {
            const relativePath = path.relative(notesRootPath, fullPath);
            fileList.push({
                label: entry.name, // Display filename primarily
                filePath: fullPath,
                description: path.dirname(relativePath) !== '.' ? path.dirname(relativePath) : '' // Show subfolder if not root
            });
        }
    }
    return fileList;
}

export async function findNoteHandler(): Promise<void> {
    const notesRootPath = getNotesPath();

    if (!notesRootPath) {
        vscode.window.showErrorMessage('Simple Note: Notes path not set. Please configure "simpleNote.notesPath".');
        return;
    }

    try {
        const allNotes = await findAllFiles(notesRootPath, notesRootPath);

        if (allNotes.length === 0) {
            vscode.window.showInformationMessage('No notes found in your notes directory.');
            return;
        }

        const selectedNote = await vscode.window.showQuickPick<FoundNote>(allNotes, {
            placeHolder: 'Type to search for a note by name or path...',
            matchOnDescription: true, // Allows searching the subfolder path
            // Consider adding matchOnDetail if you add more details to FoundNote
        });

        if (selectedNote) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(selectedNote.filePath));
            await vscode.window.showTextDocument(doc);
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error finding notes: ${error.message}`);
    }
} 