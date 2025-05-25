# Simple Note VSCode Extension

A Visual Studio Code extension for quickly jotting down notes and thoughts without leaving your editor.

## Features

*   **Dedicated Note Explorer**: Access and manage your notes easily through a dedicated view in the Activity Bar.
*   **Note Operations**:
    *   Create new notes (supports configurable default file extensions).
    *   Create new subdirectories to organize your notes.
    *   Rename notes and directories.
    *   Delete notes and directories.
*   **Template-Based Note Creation**:
    *   Quickly create new notes from predefined templates.
    *   Easily create new templates from existing notes or new content.
*   **Powerful Search**:
    *   Find notes by their file names.
    *   Search for text within the content of all your notes.
*   **Intuitive Interface**:
    *   Refresh the Note Explorer to reflect external changes.
    *   Most actions are available via context menus within the Note Explorer.
    *   Dedicated icons for common actions in the Note Explorer's title bar.

## Usage

1.  **Configure your notes directory**:
    *   Set the `simpleNote.notesPath` to the absolute path where you want to store your notes (e.g., `/YOUR_NOTE_PATH`.
2.  **(Optional) Configure your templates directory**:
    *   If you plan to use templates, set `simpleNote.templatesPath` to the absolute path of your templates folder.
3.  **Access the Note Explorer**:
    *   Click on the "Simple Note" icon in the Activity Bar (it looks like a document or a custom icon if `resources/icon.svg` is used).
    *   If you don't see the icon, you might need to open the view via the command palette: `View: Show Simple Note`.
4.  **Using the Explorer**:
    *   **View Title Bar Actions**:
        *   **Refresh**: Updates the list of notes and directories.
        *   **New Note**: Creates a new note in the root of your `notesPath` or selected directory.
        *   **New Directory**: Creates a new subdirectory in the root of your `notesPath` or selected directory.
        *   **New Note From Template**: Prompts you to select a template to create a new note.
        *   **Create New Template**: Helps you create a new template.
        *   **Find Note by Name**: Searches for notes by filename.
        *   **Search Content**: Searches for text within your notes.
    *   **Context Menu (Right-click on an item or empty space)**:
        *   On a directory: New Note, New Directory, New Note From Template, Rename, Delete.
        *   On a file: Rename, Delete.
        *   In an empty area of the explorer: New Note, New Directory, New Note From Template.
5.  **Commands**:
    *   All features are also available via the Command Palette (Ctrl+Shift+P or Cmd+Shift+P). Search for "Simple Note:" to see all available commands.

## Extension Settings

This extension contributes the following settings (configurable in User or Workspace settings):

*   `simpleNote.notesPath` (string):
    *   Description: The absolute path to your notes directory.
    *   Default: `""` (User must configure this for the extension to work properly)
*   `simpleNote.defaultExtension` (string):
    *   Description: The default file extension for new notes (e.g., `md`, `txt`). Do not include the leading dot.
    *   Default: `"md"`
*   `simpleNote.templatesPath` (string):
    *   Description: The absolute path to your notes templates directory. Leave empty to disable template functionality or if you don't use templates.
    *   Default: `""`

## Known Issues

*   Please report any issues on the [GitHub Issues page](https://github.com/dautroc/simple-note-vscode/issues).

## Roadmap

*   (To be defined) Future enhancements and features will be tracked on the [GitHub Issues page](https://github.com/dautroc/simple-note-vscode/issues) and project boards.