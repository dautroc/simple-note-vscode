// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NoteExplorerProvider, NoteItem } from './noteExplorerProvider';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Helper function to convert a string to title case (e.g., "first_meeting" -> "First Meeting")
function toTitleCase(str: string): string {
	return str.replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
		.replace(/\w\S*/g, (txt) => { // Capitalize the first letter of each word
			return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
		});
}

// Helper function to get the ISO week number
function getISOWeek(date: Date): string {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	// Thursday in current week decides the year.
	d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
	// January 4 is always in week 1.
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
	// Calculate full weeks to nearest Thursday
	const weekNumber = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
	return weekNumber.toString().padStart(2, '0');
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "simple-note-vscode" is now active!');

	const disposable = vscode.commands.registerCommand('simple-note-vscode.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from simple-note-vscode!');
	});

	context.subscriptions.push(disposable);

	// Register the TreeDataProvider for the Note Explorer
	const noteExplorerProvider = new NoteExplorerProvider();
	vscode.window.registerTreeDataProvider('simpleNoteExplorer', noteExplorerProvider);

	// Register the command to open/focus the Note Explorer
	const openNoteExplorerCommand = vscode.commands.registerCommand('simple-note-vscode.openNoteExplorer', () => {
		vscode.commands.executeCommand('workbench.view.extension.simple-note-explorer-view-container');
	});
	context.subscriptions.push(openNoteExplorerCommand);

	// Add a command to refresh the note explorer
	const refreshNoteExplorerCommand = vscode.commands.registerCommand('simple-note-vscode.refreshNoteExplorer', () => {
		noteExplorerProvider.refresh();
	});
	context.subscriptions.push(refreshNoteExplorerCommand);

	// Helper function to get the root notes path
	function getNotesPath(): string | undefined {
		return vscode.workspace.getConfiguration('simpleNote').get<string>('notesPath');
	}

	// Command: New File
	const newNoteCommand = vscode.commands.registerCommand('simple-note-vscode.newNote', async (item?: NoteItem) => {
		const notesRootPath = getNotesPath();
		if (!notesRootPath) {
			vscode.window.showErrorMessage('Simple Note: Notes path not set.');
			return;
		}

		const parentPath = item && item.itemType === 'directory' ? item.filePath : notesRootPath;

		let fileName = await vscode.window.showInputBox({ prompt: 'Enter the name for the new note (extension will be added if not provided)' });
		if (fileName) {
			const config = vscode.workspace.getConfiguration('simpleNote');
			const defaultExtension = config.get<string>('defaultExtension', 'md');

			// Add default extension if not provided by the user
			if (defaultExtension && !path.extname(fileName)) {
				fileName = `${fileName}.${defaultExtension}`;
			} else if (defaultExtension && path.extname(fileName) === '.'){
				// Handle case where user types just a dot e.g. "mynote."
				fileName = `${fileName}${defaultExtension}`;
			}

			const filePath = path.join(parentPath, fileName);

			// Check if file already exists
			if (fs.existsSync(filePath)) {
				vscode.window.showErrorMessage(`Note already exists: ${filePath}`);
				return;
			}

			try {
				fs.writeFileSync(filePath, ''); // Create an empty file
				noteExplorerProvider.refresh();
				const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
				await vscode.window.showTextDocument(doc);
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to create note: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(newNoteCommand);

	// Command: New Directory
	const newDirectoryCommand = vscode.commands.registerCommand('simple-note-vscode.newDirectory', async (item?: NoteItem) => {
		const notesRootPath = getNotesPath();
		if (!notesRootPath) {
			vscode.window.showErrorMessage('Simple Note: Notes path not set.');
			return;
		}

		const parentPath = item && item.itemType === 'directory' ? item.filePath : notesRootPath;

		const dirName = await vscode.window.showInputBox({ prompt: 'Enter the name for the new directory' });
		if (dirName) {
			const dirPath = path.join(parentPath, dirName);
			try {
				fs.mkdirSync(dirPath);
				noteExplorerProvider.refresh();
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to create directory: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(newDirectoryCommand);

	// Command: Rename Item
	const renameItemCommand = vscode.commands.registerCommand('simple-note-vscode.renameItem', async (item: NoteItem) => {
		if (!item) {
			vscode.window.showWarningMessage('Select an item to rename from the Note Explorer.');
			return;
		}
		const oldPath = item.filePath;
		const newName = await vscode.window.showInputBox({ value: item.label, prompt: 'Enter the new name' });
		if (newName && newName !== item.label) {
			const newPath = path.join(path.dirname(oldPath), newName);
			try {
				fs.renameSync(oldPath, newPath);
				noteExplorerProvider.refresh();
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to rename: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(renameItemCommand);

	// Command: Delete Item
	const deleteItemCommand = vscode.commands.registerCommand('simple-note-vscode.deleteItem', async (item: NoteItem) => {
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
					fs.rmSync(item.filePath, { recursive: true, force: true }); // Use rmSync for directories
				}
				noteExplorerProvider.refresh();
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to delete: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(deleteItemCommand);

	// Command: New File From Template
	const newNoteFromTemplateCommand = vscode.commands.registerCommand('simple-note-vscode.newNoteFromTemplate', async (item?: NoteItem) => {
		const config = vscode.workspace.getConfiguration('simpleNote');
		const notesRootPath = config.get<string>('notesPath');
		const templatesPath = config.get<string>('templatesPath');

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

			const defaultExtension = config.get<string>('defaultExtension', 'md');
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

			// --- Process template variables --- 
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

			// Note Name / Title Processing
			if (newNoteName) {
				const noteFileNameBase = path.basename(newNoteName, path.extname(newNoteName));
				// For {title}, convert to title case
				const formattedTitle = toTitleCase(noteFileNameBase);
				templateContentString = templateContentString.replace(/\{title\}/g, formattedTitle);
				// For {note_name}, use the base filename directly
				templateContentString = templateContentString.replace(/\{note_name\}/g, noteFileNameBase);
			}

			// UUID Processing
			const newUuid = crypto.randomUUID();
			templateContentString = templateContentString.replace(/\{uuid\}/g, newUuid);

			fs.writeFileSync(newNotePath, templateContentString);
			noteExplorerProvider.refresh();
			const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(newNotePath));
			await vscode.window.showTextDocument(doc);

		} catch (error: any) {
			vscode.window.showErrorMessage(`Failed to create note from template: ${error.message}`);
		}
	});
	context.subscriptions.push(newNoteFromTemplateCommand);

	// Command: Create New Template
	const createTemplateCommand = vscode.commands.registerCommand('simple-note-vscode.createTemplate', async () => {
		const config = vscode.workspace.getConfiguration('simpleNote');
		const templatesPath = config.get<string>('templatesPath');

		if (!templatesPath) {
			vscode.window.showErrorMessage('Simple Note: Templates path not set. Please configure "simpleNote.templatesPath" to create templates.');
			return;
		}

		// Ensure templatesPath exists
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

		// Apply default extension if not provided, similar to notes
		const defaultExtension = config.get<string>('defaultExtension', 'md'); 
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
			fs.writeFileSync(templateFilePath, ''); // Create an empty template file
			const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(templateFilePath));
			await vscode.window.showTextDocument(doc);
			vscode.window.showInformationMessage(`Template created and opened: ${templateName}`);
		} catch (error: any) {
			vscode.window.showErrorMessage(`Failed to create template: ${error.message}`);
		}
	});
	context.subscriptions.push(createTemplateCommand);
}

export function deactivate() {}
