import * as vscode from 'vscode';
import { IconProvider } from './IconProvider';
import { ExtendedTreeNodeTypes as TreeNodeTypes, InspectorElement, InspectorTreeItem } from './types';

export class TreeItem extends vscode.TreeItem implements InspectorTreeItem {

    public get itemType(): string {
        let type = '';
        if (typeof this.item === 'string') {
            type = this.item;
        } else if (this.item.type) {
            type = this.item.type;
        } else {
            switch (this.item.constructor.name) {
                case 'DbInspector':
                    type = 'inspector';
                    break;

                default:
                    type = '';
                    break;
            }
        }
        return type;
    }

    public get iconPath(): string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } | vscode.ThemeIcon {
        return IconProvider.getIconForItem(this.item);
    }

    public get tooltip(): string {
        // if the item is a document: show content (json)
        if (this.itemType === TreeNodeTypes.DOCUMENT) {
            const { type, ...document } = this.item;
            return JSON.stringify(document, null, 2);
        }

        return this.label;
    }

    public get contextValue(): string {
        return this.itemType;
    }

    public get command(): vscode.Command | undefined {
        let command: vscode.Command | undefined = undefined;

        switch (this.itemType) {
            case 'inspector':
                command = {
                    command: 'mongoExplorer.refreshInspector',
                    arguments: [this],
                    title: 'Refresh Database'
                };
                break;

            case 'document':
                command = {
                    command: 'mongoExplorer.openDocument',
                    arguments: [this],
                    title: 'Open Document'
                };
                break;

            default:
                break;
        }

        return command;
    }

    constructor(
        public item: any,
        public label: string,
        public collapsibleState: vscode.TreeItemCollapsibleState,
        public elements: any,
        public description?: string
    ) {
        super(label, collapsibleState);
    }

    /**
     * Returns the children of this item as TreeItems
     * 
     * @returns {TreeItem[]}
     */
    public children(): TreeItem[] {
        let children: TreeItem[] = [];

        if (this.elements instanceof Array) {
            children = this.getChildTree(this.elements);
        } else if (this.elements instanceof Object) {
            for (const key in this.elements) {
                if (key !== 'meta') {
                    const values = this.elements[key];
                    const item = {
                        type: key,
                        meta: this.elements['meta']
                    };
                    children.push(
                        new TreeItem(
                            item,
                            key,
                            vscode.TreeItemCollapsibleState.Collapsed,
                            values,
                            key === 'databases' ? `(${this.countDbs(values)})` : undefined // add the number of dbs to description label
                        )
                    );
                }
            }
        }
        return children;
    }

    /**
     * Builds the child tree of the provided items as TreeItems
     *
     * @returns {TreeItem[]}
     */
    private getChildTree(items: InspectorElement[]): TreeItem[] {
        let children: TreeItem[] = [];

        for (const item of items) {
            let type: string = item?.type;
            if (type.includes(':')) {
                type = type.split(':')[0];
            }

            switch (type) {
                case TreeNodeTypes.DATABASE:
                    children.push(
                        new TreeItem(item, item.name, vscode.TreeItemCollapsibleState.Collapsed, item.collections)
                    );
                    break;

                case TreeNodeTypes.COLLECTION:
                    children.push(
                        new TreeItem(item, item.name, vscode.TreeItemCollapsibleState.Collapsed, item.values)
                    );
                    break;

                case TreeNodeTypes.INDEX:
                    children.push(
                        new TreeItem(item, item.name, vscode.TreeItemCollapsibleState.None, null)
                    );
                    break;

                case TreeNodeTypes.DOCUMENT:
                    const docId = item._id?.toString() || '';
                    children.push(
                        new TreeItem(item, docId, vscode.TreeItemCollapsibleState.None, null)
                    );
                    break;

                case TreeNodeTypes.GROUP:
                    children.push(
                        new TreeItem(
                            item,
                            item.name,
                            vscode.TreeItemCollapsibleState.Collapsed,
                            item.values,
                            (item.meta?.count ? `(${item.meta.count})` : undefined)
                        )
                    );
                    break;

                default:
                    break;
            }

        }

        return children;
    }

    /**
     * Returns the number of databases with regard to grouped databases
     * 
     * @param {Array<any>} dbs - the databases to count 
     */
    private countDbs(dbs: Array<any>): number {
        let count = 0;

        for (const item of dbs) {
            if (item.hasOwnProperty('meta') && item.meta.hasOwnProperty('count')) {
                count += item.meta.count;
            } else if (item.type === TreeNodeTypes.GROUP) {
                count += item.dbs.length;
            }
            else {
                count++;
            }
        }

        return count;
    }
}