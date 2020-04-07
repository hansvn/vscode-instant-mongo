import * as vscode from 'vscode';

export class VsCodeHelper {
    public static openTextDocument(text: string, language?: string): Thenable<vscode.TextDocument> {
        return vscode.workspace.openTextDocument({ content: text, language });
    };

    public static openTextInEditor(text: string, language = 'json', format = true) {
        let document: vscode.TextDocument;
        return VsCodeHelper.openTextDocument(text, language)
            .then((textDoc) => {
                document = textDoc;
                return vscode.window.showTextDocument(document, 1, true);
            })
            .then((editor) => {
                format && vscode.commands.executeCommand('editor.action.formatDocument');
                return { document, editor };
            });
    }

    public static showInfoMessage(message: string): void {
        vscode.window.showInformationMessage(message);
    }
}