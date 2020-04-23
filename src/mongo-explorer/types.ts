import * as vscode from 'vscode';
import { DbInspector } from './DbInspector';
const { TreeNodeTypes } = require('mongodb-topology');

export type DBConnection = {
    uri: string;
    name: string;
}

export const ExtendedTreeNodeTypes = Object.assign(TreeNodeTypes, {
    DOCUMENT: 'document',
    GROUP: 'group',
    GROUP_COLLECTION: `group:${TreeNodeTypes.COLLECTION}`,
    GROUP_INDEX: `group:${TreeNodeTypes.INDEXES}`,
    GROUP_SYSTEMDB: `group:system_db`,
});

export type InspectorElement = {
    name: string;
    type: string,
    values?: InspectorElement[],
    dbName?: string,
    _id?: string,
    collections?: Array<any>,
    indexes?: Array<any>,
    meta?: any,
    commands?: any
}

export interface InspectorTreeItem {
    readonly itemType: string,
    item: InspectorElement | DbInspector,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    elements: InspectorElement[] | object,
    description?: string
}
