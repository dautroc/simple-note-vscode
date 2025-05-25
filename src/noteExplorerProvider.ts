import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class NoteItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly filePath: string,
        public readonly itemType: 'file' | 'directory',
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.filePath}`;
        this.description = false;
        this.command = command || {
            command: 'vscode.open',
            title: 'Open Note',
            arguments: [vscode.Uri.file(this.filePath)]
        };
        this.contextValue = itemType;

        if (itemType === 'directory') {
            this.command = undefined;
        }
    }
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
        const currentPath = element ? element.filePath : this.notesPath;

        if (!currentPath) {
            if (!this.notesPath) {
                 vscode.window.showInformationMessage('No notes path configured. Please set "Simple Note: Notes Path" in your settings.');
            }
            return Promise.resolve([]);
        }

        return new Promise((resolve, reject) => {
            fs.readdir(currentPath, { withFileTypes: true }, (err, entries) => {
                if (err) {
                    vscode.window.showErrorMessage(`Error reading directory ${currentPath}: ${err.message}`);
                    return reject(err);
                }

                const items = entries.map(entry => {
                    const entryPath = path.join(currentPath, entry.name);
                    if (entry.isFile()) {
                        return new NoteItem(entry.name, vscode.TreeItemCollapsibleState.None, entryPath, 'file');
                    } else if (entry.isDirectory()) {
                        return new NoteItem(entry.name, vscode.TreeItemCollapsibleState.Collapsed, entryPath, 'directory');
                    }
                    return null;
                }).filter(item => item !== null) as NoteItem[];
                
                items.sort((a, b) => {
                    if (a.itemType === 'directory' && b.itemType === 'file') {
                        return -1;
                    }
                    if (a.itemType === 'file' && b.itemType === 'directory') {
                        return 1;
                    }
                    return a.label.localeCompare(b.label);
                });

                resolve(items);
            });
        });
    }
} 