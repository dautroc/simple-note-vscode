import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
// import * as crypto from 'crypto'; // No longer needed here
import { NoteItem, NoteExplorerProvider } from '../noteExplorerProvider';
import { getNotesPath, getDefaultExtension, getDefaultTemplatePath } from '../utils/configUtils';
// import { toTitleCase } from '../utils/stringUtils'; // No longer needed here
// import { getISOWeek } from '../utils/dateUtils'; // No longer needed here
import { processPlaceholders } from '../utils/templateUtils'; // Import from new utility

// Function to process placeholders, similar to newNoteFromTemplateHandler -- REMOVED

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
            const action = await vscode.window.showWarningMessage(
                `Note already exists: ${fileName}`,
                { modal: false }, 
                'Open Existing Note'
            );
            if (action === 'Open Existing Note') {
                try {
                    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
                    await vscode.window.showTextDocument(doc);
                } catch (error: any) {
                    vscode.window.showErrorMessage(`Failed to open existing note: ${error.message}`);
                }
            }
            return;
        }

        let noteContent = '';
        const defaultTemplatePath = getDefaultTemplatePath();

        if (defaultTemplatePath) {
            if (fs.existsSync(defaultTemplatePath)) {
                try {
                    const templateContent = fs.readFileSync(defaultTemplatePath, 'utf8');
                    noteContent = processPlaceholders(templateContent, fileName);
                } catch (error: any) {
                    vscode.window.showWarningMessage(`Failed to read default template at ${defaultTemplatePath}. Creating a blank note. Error: ${error.message}`);
                    // Fallback to blank note if template reading fails
                }
            } else {
                vscode.window.showWarningMessage(`Default template not found at ${defaultTemplatePath}. Creating a blank note.`);
                // Fallback to blank note if template path is set but file doesn't exist
            }
        }

        try {
            fs.writeFileSync(filePath, noteContent);
            noteExplorerProvider?.refresh(); // Use optional chaining as provider might not always be passed
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            await vscode.window.showTextDocument(doc);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create note: ${error.message}`);
        }
    }
} 