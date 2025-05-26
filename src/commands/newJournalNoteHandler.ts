import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { NoteExplorerProvider } from '../noteExplorerProvider';
import { getNotesPath, getDefaultExtension, getDefaultTemplatePath, getJournalTemplatePath } from '../utils/configUtils';
import { toTitleCase } from '../utils/stringUtils';
import { getISOWeek } from '../utils/dateUtils';

// Re-using placeholder processing from newNoteHandler (could be refactored into a shared utility)
function processPlaceholders(content: string, noteName: string): string {
    let processedContent = content;
    const currentDate = new Date(); // Placeholders will be based on the moment of creation
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

export async function newJournalNoteHandler(noteExplorerProvider?: NoteExplorerProvider): Promise<void> {
    const notesRootPath = getNotesPath();
    if (!notesRootPath) {
        vscode.window.showErrorMessage('Simple Note: Notes path not set. Please configure "simpleNote.notesPath".');
        return;
    }

    const journalDirName = 'journal';
    const journalPath = path.join(notesRootPath, journalDirName);

    try {
        if (!fs.existsSync(journalPath)) {
            fs.mkdirSync(journalPath, { recursive: true });
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create journal directory at ${journalPath}: ${error.message}`);
        return;
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    
    const noteFileNameBase = `${year}_${month}_${day}`;
    const defaultExtension = getDefaultExtension();
    const noteFileName = `${noteFileNameBase}.${defaultExtension}`;
    const filePath = path.join(journalPath, noteFileName);

    if (fs.existsSync(filePath)) {
        try {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            await vscode.window.showTextDocument(doc);
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to open existing journal note ${noteFileName}: ${error.message}`);
        }
        return;
    }

    let noteContent = '';
    let templateUsedPath: string | undefined = undefined;

    const journalTemplatePath = getJournalTemplatePath();
    const defaultTemplatePath = getDefaultTemplatePath();

    // Try journal template first
    if (journalTemplatePath) {
        if (fs.existsSync(journalTemplatePath)) {
            try {
                const templateContent = fs.readFileSync(journalTemplatePath, 'utf8');
                noteContent = processPlaceholders(templateContent, noteFileNameBase);
                templateUsedPath = journalTemplatePath;
            } catch (error: any) {
                vscode.window.showWarningMessage(`Failed to read journal template at ${journalTemplatePath}. Error: ${error.message}`);
                // Will try default template next or fall back to blank
            }
        } else {
            vscode.window.showWarningMessage(`Journal template not found at ${journalTemplatePath}.`);
             // Will try default template next or fall back to blank
        }
    }

    // If journal template wasn't used or failed, try default template
    if (!templateUsedPath && defaultTemplatePath) {
        if (fs.existsSync(defaultTemplatePath)) {
            try {
                const templateContent = fs.readFileSync(defaultTemplatePath, 'utf8');
                noteContent = processPlaceholders(templateContent, noteFileNameBase);
                templateUsedPath = defaultTemplatePath;
            } catch (error: any) {
                vscode.window.showWarningMessage(`Failed to read default template at ${defaultTemplatePath}. Creating a blank journal note. Error: ${error.message}`);
            }
        } else {
            // Only show warning if default template was explicitly configured but not found, and journal template wasn't tried or found
            if (!journalTemplatePath) { 
                 vscode.window.showWarningMessage(`Default template not found at ${defaultTemplatePath}. Creating a blank journal note.`);
            }
        }
    }
    
    if (!templateUsedPath && !journalTemplatePath && !defaultTemplatePath) {
        // No templates configured, inform user it will be blank.
        // This message is a bit redundant if warnings were already shown, but good for the case of no templates configured at all.
        // vscode.window.showInformationMessage('No journal or default template configured. Creating a blank journal note.');
    } else if (!templateUsedPath && (journalTemplatePath || defaultTemplatePath)) {
        vscode.window.showInformationMessage('No suitable template found or template read failed. Creating a blank journal note.');
    }

    try {
        fs.writeFileSync(filePath, noteContent);
        noteExplorerProvider?.refresh();
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create journal note ${noteFileName}: ${error.message}`);
    }
} 