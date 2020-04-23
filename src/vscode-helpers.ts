import * as vscode from 'vscode';

/**
 * VsCodeHelpers provides several utility functions related to actions for the editor workspace
 *
 * @export
 * @class VsCodeHelpers
 */
export class VsCodeHelpers {
    public static openTextDocument(text: string, language?: string): Thenable<vscode.TextDocument> {
        return vscode.workspace.openTextDocument({ content: text, language });
    };

    public static openTextInEditor(text: string, language = 'json') {
        return VsCodeHelpers.openTextDocument(text, language)
            .then((document) => {
                return vscode.window.showTextDocument(document, 1, true);
            });
    }

    public static openFormattedTextInEditor(text: string, language = 'json') {
        return VsCodeHelpers.openTextInEditor(text, language)
            .then((editor) => {
                vscode.commands.executeCommand('editor.action.formatDocument');
                return editor;
            });
    }

    public static showInfoMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }
}