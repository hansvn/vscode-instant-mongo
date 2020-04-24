import * as vscode from 'vscode';
import { DbInspector } from './DbInspector';
import { DBConnection } from './types';
import { TreeItem } from './TreeItem';

/**
 * Return a TreeProvider that lists all database connections
 */
export class TreeProvider implements vscode.TreeDataProvider<TreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<TreeItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

    private connections: DBConnection[] = [];
    private inspectors: DbInspector[] = [];

    constructor(connections: DBConnection[]) {
        this.connections = connections;
        this.createInspectors();
        this.inspectDatabases();
    }

    public resetDbConnections(connections: DBConnection[]): void {
        this.connections = connections;
        this.reCreateInspectors();
        this.inspectDatabases();
    }

    /**
    * returns the UI interpretation of a TreeItem
    * @memberof vscode.TreeDataProvider
    */
    public getTreeItem(element: TreeItem): TreeItem {
        return element;
    }

    /**
    * @memberof vscode.TreeDataProvider
    */
    public async getChildren(element?: TreeItem): Promise<TreeItem[]> {
        let children: TreeItem[] = [];

        if (element) {
            children = element.children();
        } else {
            // return all database connections as children
            for (const inspector of this.inspectors) {
                if (!inspector.inspected) {
                    await inspector.inspect();
                }
                // create tree item
                children.push(
                    new TreeItem(inspector, inspector.name, vscode.TreeItemCollapsibleState.Collapsed, inspector.tree)
                );
            }
        }

        return Promise.resolve(children);
    }

    public addDbConnection(connection: DBConnection): void {
        this.connections.push(connection);
        this.createInspectors();
    }

    public removeDbConnection(connection: DBConnection): void {
        this.connections = this.connections.filter(conn => {
            return !(conn.name === connection.name && conn.uri == connection.uri);
        });
        this.reCreateInspectors();
    }

    public fireContentUpdated(): void {
        this._onDidChangeTreeData.fire();
    }

    public triggerContentUpdated(): void {
        this.reInspectDatabases();
    }

    private createInspectors(): void {
        this.inspectors = [];
        for (const connection of this.connections) {
            // check connection uri
            const uri_regex = /(mongodb(?:\+srv|)):\/\/(?: (?:[^:]*) (?: : ([^@]*) )? @ )?([^/?]*)(?:\/|)(.*)/;
            if (!connection.uri.match(uri_regex)) {
                vscode.window.showErrorMessage(
                    `MongoDB Connection '${connection.name}' has an invalid URI.`
                );
            } else {
                this.inspectors.push(
                    new DbInspector(connection)
                );
            }
        }

        // also fire list changed event
        this.fireContentUpdated();
    }

    private reCreateInspectors(): void {
        this.destroyInspectors();
        this.createInspectors();
    }

    private destroyInspectors(): void {
        for (const inspector of this.inspectors) {
            inspector.destroy();
        }
        this.inspectors = [];
    }

    private async inspectDatabases(): Promise<void> {
        for (const inspector of this.inspectors) {
            if (!inspector.inspected) {
                await inspector.inspect();
            }
        }

        this.fireContentUpdated();
    }

    private reInspectDatabases(): void {
        for (const inspector of this.inspectors) {
            inspector.resetInspection();
        }

        this.inspectDatabases();
    }
}
