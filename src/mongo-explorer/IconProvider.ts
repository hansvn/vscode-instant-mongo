import * as vscode from 'vscode';
import * as path from 'path';
import { ExtendedTreeNodeTypes as TreeNodeTypes } from './types';

export class IconProvider {
    private static getFilePath(name: string, theme: string) {
        return path.join(__dirname, '..', '..', 'resources', 'icons', theme, name);
    }

    private static getIconPath(icon: string): vscode.ThemeIcon {
        return {
            light: IconProvider.getFilePath(`${icon}.svg`, 'light'),
            dark: IconProvider.getFilePath(`${icon}.svg`, 'dark')
        };
    }

    public static getIconForItem(item: any): string | vscode.ThemeIcon {
        let type: string = '';

        if (item) {
            if (typeof item === 'string') {
                type = item;
            } else if (item.type) {
                type = item.type;
            } else {
                switch (item.constructor.name) {
                    case 'DbInspector':
                        type = item.isConnected ? 'host:connected' : 'host:closed';
                        break;

                    default:
                        type = '';
                        break;
                }
            }
        }

        return IconProvider.getIconForType(type);
    }

    public static getIconForType(type: string): string | vscode.ThemeIcon {
        switch (type) {
            case `host:closed`:
                return new vscode.ThemeIcon('error');
            case `host:connected`:
                return new vscode.ThemeIcon('link');
            case TreeNodeTypes.DATABASES:
            case TreeNodeTypes.DATABASE:
                return IconProvider.getIconPath('mongodb');
            case TreeNodeTypes.USERS:
                return IconProvider.getIconPath('users');
            case TreeNodeTypes.ROLES:
                return new vscode.ThemeIcon('credit-card');
            case TreeNodeTypes.COLLECTION:
                return IconProvider.getIconPath('collection');
            case TreeNodeTypes.DOCUMENT:
                return IconProvider.getIconPath('document');
            case TreeNodeTypes.PRIMARY:
                return new vscode.ThemeIcon('list-tree');
            case TreeNodeTypes.SECONDARY:
                return new vscode.ThemeIcon('list-tree');
            case TreeNodeTypes.ARBITER:
                return new vscode.ThemeIcon('list-tree');
            case TreeNodeTypes.REPLICASET:
                return new vscode.ThemeIcon('multiple-windows');
            case TreeNodeTypes.CONFIG:
            case TreeNodeTypes.CONFIGS:
                return new vscode.ThemeIcon('settings');
            case TreeNodeTypes.SHARD:
            case TreeNodeTypes.SHARDS:
                return new vscode.ThemeIcon('list-unordered');
            case TreeNodeTypes.MONGOS:
            case TreeNodeTypes.ROUTERS:
                return new vscode.ThemeIcon('circuit-board');
            case TreeNodeTypes.INDEX:
            case TreeNodeTypes.INDEXES:
                return IconProvider.getIconPath('index');
            case TreeNodeTypes.FIELDS:
            case TreeNodeTypes.FIELD:
                return new vscode.ThemeIcon('symbol-string');
            case TreeNodeTypes.GROUP_COLLECTION:
                return new vscode.ThemeIcon('versions');
            case TreeNodeTypes.GROUP_INDEX:
                return IconProvider.getIconPath('indexes');
            case TreeNodeTypes.GROUP_SYSTEMDB:
                return IconProvider.getIconPath('system_db');
        }

        return new vscode.ThemeIcon('chrome-maximize');
    }
};
