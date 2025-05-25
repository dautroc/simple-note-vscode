// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { NoteExplorerProvider, NoteItem } from './noteExplorerProvider';
// import * as fs from 'fs'; // No longer directly needed for fs operations here
// import * as path from 'path'; // No longer directly needed for path operations here
// import * as crypto from 'crypto'; // No longer directly needed for crypto operations here

// Utilities - these are now in src/utils/* and will be used by handlers
// import { toTitleCase } from './utils/stringUtils'; 
// import { getISOWeek } from './utils/dateUtils';
// import { getNotesPath, getTemplatesPath, getDefaultExtension } from './utils/configUtils';

// Command Handlers
import { newNoteHandler } from './commands/newNoteHandler';
import { newDirectoryHandler } from './commands/newDirectoryHandler';
import { renameItemHandler } from './commands/renameItemHandler';
import { deleteItemHandler } from './commands/deleteItemHandler';
import { newNoteFromTemplateHandler } from './commands/newNoteFromTemplateHandler';
import { createTemplateHandler } from './commands/createTemplateHandler';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "simple-note-vscode" is now active!');

	// Register the TreeDataProvider for the Note Explorer
	const noteExplorerProvider = new NoteExplorerProvider();
	vscode.window.registerTreeDataProvider('simpleNoteExplorer', noteExplorerProvider);

	// Register Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('simple-note-vscode.helloWorld', () => {
			vscode.window.showInformationMessage('Hello World from simple-note-vscode!');
		}),
		vscode.commands.registerCommand('simple-note-vscode.openNoteExplorer', () => {
			vscode.commands.executeCommand('workbench.view.extension.simple-note-explorer-view-container');
		}),
		vscode.commands.registerCommand('simple-note-vscode.refreshNoteExplorer', () => noteExplorerProvider.refresh()),
		
		// Refactored commands
		vscode.commands.registerCommand('simple-note-vscode.newNote', 
			(item?: NoteItem) => newNoteHandler(item, noteExplorerProvider)
		),
		vscode.commands.registerCommand('simple-note-vscode.newDirectory', 
			(item?: NoteItem) => newDirectoryHandler(item, noteExplorerProvider)
		),
		vscode.commands.registerCommand('simple-note-vscode.renameItem', 
			(item?: NoteItem) => renameItemHandler(item, noteExplorerProvider)
		),
		vscode.commands.registerCommand('simple-note-vscode.deleteItem', 
			(item?: NoteItem) => deleteItemHandler(item, noteExplorerProvider)
		),
		vscode.commands.registerCommand('simple-note-vscode.newNoteFromTemplate', 
			(item?: NoteItem) => newNoteFromTemplateHandler(item, noteExplorerProvider)
		),
		vscode.commands.registerCommand('simple-note-vscode.createTemplate', createTemplateHandler)
	);
}

export function deactivate() {}
