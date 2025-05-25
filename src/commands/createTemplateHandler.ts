import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getTemplatesPath, getDefaultExtension } from '../utils/configUtils';

export async function createTemplateHandler(): Promise<void> {
    const templatesPath = getTemplatesPath();

    if (!templatesPath) {
        vscode.window.showErrorMessage('Simple Note: Templates path not set. Please configure "simpleNote.templatesPath" to create templates.');
        return;
    }

    try {
        if (!fs.existsSync(templatesPath)) {
            fs.mkdirSync(templatesPath, { recursive: true });
            vscode.window.showInformationMessage(`Templates directory created at: ${templatesPath}`);
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create templates directory: ${error.message}`);
        return;
    }

    let templateName = await vscode.window.showInputBox({
        prompt: 'Enter the name for the new template (e.g., meeting_minutes.md or weekly_review.txt)',
        placeHolder: 'template_name.md'
    });

    if (!templateName) {
        return; // User cancelled
    }

    const defaultExtension = getDefaultExtension(); 
    if (!path.extname(templateName) && defaultExtension) {
        templateName = `${templateName}.${defaultExtension}`;
    } else if (path.extname(templateName) === '.' && defaultExtension) {
        templateName = `${templateName}${defaultExtension}`;
    }

    const templateFilePath = path.join(templatesPath, templateName);

    if (fs.existsSync(templateFilePath)) {
        vscode.window.showErrorMessage(`Template already exists: ${templateFilePath}`);
        return;
    }

    try {
        fs.writeFileSync(templateFilePath, '');
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(templateFilePath));
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`Template created and opened: ${templateName}`);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create template: ${error.message}`);
    }
} 