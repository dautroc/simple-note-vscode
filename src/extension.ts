// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NoteExplorerProvider, NoteItem } from './noteExplorerProvider';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "simple-note-vscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('simple-note-vscode.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from simple-note-vscode!');
	});

	context.subscriptions.push(disposable);

	// Register the TreeDataProvider for the Note Explorer
	const noteExplorerProvider = new NoteExplorerProvider();
	vscode.window.registerTreeDataProvider('simpleNoteExplorer', noteExplorerProvider);

	// Register the command to open/focus the Note Explorer
	const openNoteExplorerCommand = vscode.commands.registerCommand('simple-note-vscode.openNoteExplorer', () => {
		vscode.commands.executeCommand('workbench.view.extension.simple-note-explorer-view-container');
		// You might also want to ensure the specific view is focused if the container can have multiple views
		// For now, focusing the container should be sufficient as it only has one view.
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
	const newFileCommand = vscode.commands.registerCommand('simple-note-vscode.newFile', async (item?: NoteItem) => {
		const notesRootPath = getNotesPath();
		if (!notesRootPath) {
			vscode.window.showErrorMessage('Simple Note: Notes path not set.');
			return;
		}

		const parentPath = item && item.itemType === 'directory' ? item.filePath : notesRootPath;

		const fileName = await vscode.window.showInputBox({ prompt: 'Enter the name for the new file' });
		if (fileName) {
			const filePath = path.join(parentPath, fileName);
			try {
				fs.writeFileSync(filePath, ''); // Create an empty file
				noteExplorerProvider.refresh();
				const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
				await vscode.window.showTextDocument(doc);
			} catch (error: any) {
				vscode.window.showErrorMessage(`Failed to create file: ${error.message}`);
			}
		}
	});
	context.subscriptions.push(newFileCommand);

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
}

// This method is called when your extension is deactivated
export function deactivate() {}
