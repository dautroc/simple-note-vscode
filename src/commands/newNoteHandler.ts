import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto'; // Added for UUID
import { NoteItem, NoteExplorerProvider } from '../noteExplorerProvider'; // Adjusted path
import { getNotesPath, getDefaultExtension, getDefaultTemplatePath } from '../utils/configUtils'; // Adjusted path and added getDefaultTemplatePath
import { toTitleCase } from '../utils/stringUtils'; // Added for {title} placeholder
import { getISOWeek } from '../utils/dateUtils'; // Added for date placeholders

// Function to process placeholders, similar to newNoteFromTemplateHandler
function processPlaceholders(content: string, noteName: string): string {
    let processedContent = content;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    const formattedDateTime = `${formattedDate} ${formattedTime}`;
    const currentWeek = getISOWeek(currentDate);

    processedContent = processedContent.replace(/\{date\}/g, formattedDate);
    processedContent = processedContent.replace(/\{time\}/g, formattedTime);
    processedContent = processedContent.replace(/\{datetime\}/g, formattedDateTime);
    processedContent = processedContent.replace(/\{year\}/g, year.toString());
    processedContent = processedContent.replace(/\{month\}/g, month);
    processedContent = processedContent.replace(/\{day\}/g, day);
    processedContent = processedContent.replace(/\{week\}/g, currentWeek);

    if (noteName) {
        const noteFileNameBase = path.basename(noteName, path.extname(noteName));
        const formattedTitle = toTitleCase(noteFileNameBase);
        processedContent = processedContent.replace(/\{title\}/g, formattedTitle);
        processedContent = processedContent.replace(/\{note_name\}/g, noteFileNameBase);
    }

    const newUuid = crypto.randomUUID();
    processedContent = processedContent.replace(/\{uuid\}/g, newUuid);

    return processedContent;
}

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