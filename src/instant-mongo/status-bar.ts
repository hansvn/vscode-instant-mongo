import * as vscode from 'vscode';

export class StatusBar {
    private statusBar: vscode.StatusBarItem;

    get item(): vscode.StatusBarItem {
        return this.statusBar;
    }

    constructor(context: vscode.ExtensionContext, command?: string) {
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
        if (command) {
            this.statusBar.command = command;
        }

        context.subscriptions.push(this.statusBar);
    }

    public dispose(): void {
        this.statusBar.dispose();
    }

    public hide(): void {
        this.statusBar.hide();
    }

    public show(): void {
        this.statusBar.show();
    }

    public update(status: string, tooltip?: string): void {
        this.statusBar.text = status;
        this.statusBar.tooltip = tooltip || '';
        this.statusBar.show();
    }
}