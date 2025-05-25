import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class NoteItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly filePath: string,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.filePath}`;
        this.description = false; // No description for now
        this.command = command || {
            command: 'vscode.open',
            title: 'Open Note',
            arguments: [vscode.Uri.file(this.filePath)]
        };
    }

    // You can add a custom icon for note items here if you want
    // iconPath = {
    //     light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    //     dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    // };
}

export class NoteExplorerProvider implements vscode.TreeDataProvider<NoteItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<NoteItem | undefined | null | void> = new vscode.EventEmitter<NoteItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<NoteItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private notesPath: string | undefined;

    constructor() {
        this.loadConfiguration();
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('simpleNote.notesPath')) {
                this.loadConfiguration();
                this.refresh();
            }
        });
    }

    private loadConfiguration(): void {
        this.notesPath = vscode.workspace.getConfiguration('simpleNote').get<string>('notesPath');
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: NoteItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: NoteItem): Thenable<NoteItem[]> {
        if (!this.notesPath) {
            vscode.window.showInformationMessage('No notes path configured. Please set "Simple Note: Notes Path" in your settings.');
            return Promise.resolve([]);
        }

        if (element) {
            // For now, we assume a flat list of notes, so children of a note item would be empty.
            // This could be extended later to support sub-directories.
            return Promise.resolve([]);
        } else {
            // This is the root level, list files in the notesPath
            return new Promise((resolve, reject) => {
                if (!this.notesPath) { // Double check, though loadConfiguration should handle it
                    return resolve([]);
                }
                fs.readdir(this.notesPath, (err, files) => {
                    if (err) {
                        vscode.window.showErrorMessage(`Error reading notes directory: ${err.message}`);
                        return reject(err);
                    }
                    const notes = files.map(file => {
                        const filePath = path.join(this.notesPath!, file);
                        // For now, we'll assume all files are notes.
                        // You might want to filter by extension (e.g., .md, .txt)
                        // Also, filter out directories if you only want files
                        if (fs.statSync(filePath).isFile()) {
                           return new NoteItem(file, vscode.TreeItemCollapsibleState.None, filePath);
                        }
                        return null; // Or handle directories differently
                    }).filter(note => note !== null) as NoteItem[];
                    resolve(notes);
                });
            });
        }
    }
} 