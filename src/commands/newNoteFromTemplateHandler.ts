import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { NoteItem, NoteExplorerProvider } from '../noteExplorerProvider';
import { getNotesPath, getTemplatesPath, getDefaultExtension } from '../utils/configUtils';
import { toTitleCase } from '../utils/stringUtils';
import { getISOWeek } from '../utils/dateUtils';

export async function newNoteFromTemplateHandler(item?: NoteItem, noteExplorerProvider?: NoteExplorerProvider): Promise<void> {
    const notesRootPath = getNotesPath();
    const templatesPath = getTemplatesPath();

    if (!notesRootPath) {
        vscode.window.showErrorMessage('Simple Note: Notes path not set. Please configure "simpleNote.notesPath".');
        return;
    }
    if (!templatesPath) {
        vscode.window.showErrorMessage('Simple Note: Templates path not set. Please configure "simpleNote.templatesPath".');
        return;
    }

    try {
        const templateFiles = fs.readdirSync(templatesPath).filter(file => fs.statSync(path.join(templatesPath, file)).isFile());
        if (templateFiles.length === 0) {
            vscode.window.showInformationMessage('No templates found in the configured templates directory.');
            return;
        }

        const selectedTemplateName = await vscode.window.showQuickPick(templateFiles, {
            placeHolder: 'Select a template to create a new note from'
        });

        if (!selectedTemplateName) {
            return; // User cancelled
        }

        const parentPath = item && item.itemType === 'directory' ? item.filePath : notesRootPath;
        let newNoteName = await vscode.window.showInputBox({ prompt: 'Enter the name for the new note (extension will be added if not provided)' });

        if (!newNoteName) {
            return; // User cancelled
        }

        const defaultExtension = getDefaultExtension();
        if (defaultExtension && !path.extname(newNoteName)) {
            newNoteName = `${newNoteName}.${defaultExtension}`;
        } else if (defaultExtension && path.extname(newNoteName) === '.') {
            newNoteName = `${newNoteName}${defaultExtension}`;
        }

        const newNotePath = path.join(parentPath, newNoteName);
        if (fs.existsSync(newNotePath)) {
            vscode.window.showErrorMessage(`Note already exists: ${newNotePath}`);
            return;
        }

        const templateFilePath = path.join(templatesPath, selectedTemplateName);
        let templateContentString = fs.readFileSync(templateFilePath, 'utf8');

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

        templateContentString = templateContentString.replace(/\{date\}/g, formattedDate);
        templateContentString = templateContentString.replace(/\{time\}/g, formattedTime);
        templateContentString = templateContentString.replace(/\{datetime\}/g, formattedDateTime);
        templateContentString = templateContentString.replace(/\{year\}/g, year.toString());
        templateContentString = templateContentString.replace(/\{month\}/g, month);
        templateContentString = templateContentString.replace(/\{day\}/g, day);
        templateContentString = templateContentString.replace(/\{week\}/g, currentWeek);

        if (newNoteName) {
            const noteFileNameBase = path.basename(newNoteName, path.extname(newNoteName));
            const formattedTitle = toTitleCase(noteFileNameBase);
            templateContentString = templateContentString.replace(/\{title\}/g, formattedTitle);
            templateContentString = templateContentString.replace(/\{note_name\}/g, noteFileNameBase);
        }

        const newUuid = crypto.randomUUID();
        templateContentString = templateContentString.replace(/\{uuid\}/g, newUuid);

        fs.writeFileSync(newNotePath, templateContentString);
        noteExplorerProvider?.refresh();
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(newNotePath));
        await vscode.window.showTextDocument(doc);

    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create note from template: ${error.message}`);
    }
} 