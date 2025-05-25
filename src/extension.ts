// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NoteExplorerProvider } from './noteExplorerProvider';

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
}

// This method is called when your extension is deactivated
export function deactivate() {}
