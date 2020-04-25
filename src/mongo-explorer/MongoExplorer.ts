import * as vscode from 'vscode';
import * as path from 'path';
import { VsCodeHelpers } from '../vscode-helpers';
import { TreeProvider } from './TreeProvider';
import { DbInspector } from './DbInspector';
import { DBConnection, ExtendedTreeNodeTypes, InspectorTreeItem, InspectorElement } from './types';
import { ForbiddenChars, InputValidator } from './InputValidator';
import { IconProvider } from './IconProvider';

export enum COMMAND_NAMES {
    ADD_DB_CONN = 'mongoExplorer.addDbConnection',
    REFRESH = 'mongoExplorer.refreshInspector',
    ADD_DATABASE = 'mongoExplorer.addDatabase',
    DROP_DATABASE = 'mongoExplorer.dropDatabase',
    ADD_COLLECTION = 'mongoExplorer.addCollection',
    DROP_COLLECTION = 'mongoExplorer.dropCollection',
    INSERT_DOCUMENT = 'mongoExplorer.insertDocument',
    DELETE_DOCUMENT = 'mongoExplorer.deleteDocument',
    OPEN_DOCUMENT = 'mongoExplorer.openDocument'
}

export class MongoExplorer {
    private treeProvider: TreeProvider;
    private configDbConnections: DBConnection[] = [];
    private runtimeDbConnections: DBConnection[] = [];

    private get dbConnections(): DBConnection[] {
        return [...this.runtimeDbConnections, ...this.configDbConnections];
    }

    constructor(context: vscode.ExtensionContext) {
        this.subscribeCommands(context);
        this.registerCommands();
        this.readConfigConnections();

        // init the Icon Provider
        IconProvider.initWithContext(context);

        // register databases in tree provider
        this.treeProvider = new TreeProvider(this.dbConnections);
        vscode.window.registerTreeDataProvider(
            'mongoExplorer',
            this.treeProvider
        );

        // reload datatbases when a connection is added/removed in config
        vscode.workspace.onDidChangeConfiguration(() => {
            this.readConfigConnections();
            this.treeProvider.resetDbConnections(this.dbConnections);
        });
    }

    public addDbConnection(connection: DBConnection): void {
        this.runtimeDbConnections.push(connection);
        this.treeProvider.addDbConnection(connection);
    }

    public removeDbConnection(connection: DBConnection): void {
        this.runtimeDbConnections = this.runtimeDbConnections.filter(conn => {
            return !(conn.name === connection.name && conn.uri == connection.uri);
        });
        this.treeProvider.removeDbConnection(connection);
    }

    private fireContentChanged(): void {
        this.treeProvider.triggerContentUpdated();
    }

    private subscribeCommands(context: vscode.ExtensionContext): void {
        const addDbConnCommand = vscode.commands.registerCommand(COMMAND_NAMES.ADD_DB_CONN, async () => {
            const wsFolders = vscode.workspace.workspaceFolders;
            if (wsFolders?.length) {
                const instantMongoSettings = {
                    instantMongo: { connections: [{ name: "New Database Connection", uri: "" }] }
                };
                const settingsUri = vscode.Uri.file(`${wsFolders[0].uri.path}${path.sep}.vscode${path.sep}settings.json`);
                try {
                    const doc = await vscode.workspace.openTextDocument(settingsUri);
                    await vscode.window.showTextDocument(doc);

                    // check if "instantMongo" settings are present
                    const settings = JSON.parse(doc.getText());
                    if (!settings.hasOwnProperty('instantMongo')) {
                        const position = new vscode.Position(settings.split(/\r\n|\r|\n/).length - 1, 0);
                        const workEdits = new vscode.WorkspaceEdit();
                        const textEdits = vscode.TextEdit.insert(position, ',"instantMongo":' + JSON.stringify(instantMongoSettings.instantMongo));
                        workEdits.set(doc.uri, [textEdits]);
                        vscode.workspace.applyEdit(workEdits);
                        vscode.commands.executeCommand('editor.action.formatDocument');
                    }
                } catch (error) {
                    // file not found
                    await VsCodeHelpers.openFormattedTextInEditor(JSON.stringify(instantMongoSettings));
                    await vscode.window.showSaveDialog({
                        defaultUri: settingsUri,
                        saveLabel: "Create settings.json file"
                    });
                }
            }
        });

        const refreshCommand = vscode.commands.registerCommand(COMMAND_NAMES.REFRESH, async (treeItem: InspectorTreeItem) => {
            if (treeItem?.item.constructor.name === 'DbInspector') {
                try {
                    await (treeItem.item as DbInspector).inspect();
                    this.treeProvider.fireContentUpdated();
                } catch (error) {
                    vscode.window.showErrorMessage('Could not refresh the database');
                }
            } else {
                this.treeProvider.resetDbConnections(this.dbConnections);
            }
        });

        context.subscriptions.push(addDbConnCommand);
        context.subscriptions.push(refreshCommand);
    }

    private registerCommands(): void {
        //mongoExplorer.addDatabase
        vscode.commands.registerCommand(COMMAND_NAMES.ADD_DATABASE, async (treeItem: InspectorTreeItem) => {
            const dbPlaceholder: string = '<database name>';
            const dbInput = vscode.window.createInputBox();
            dbInput.title = 'Enter Database Name';
            dbInput.prompt = `Enter a name for the database, not including any of these characters: ${ForbiddenChars.DB.join('')}`;
            dbInput.step = 1;
            dbInput.totalSteps = 2;
            dbInput.value = dbPlaceholder;
            const dbName = await new Promise((resolve, reject) => {
                dbInput.onDidAccept(() => {
                    const value = dbInput.value;
                    dbInput.dispose();
                    resolve(value);
                });
                dbInput.onDidChangeValue((input) => {
                    const validationMessage = InputValidator.validateDatabase(input, <InspectorElement[]>treeItem.elements);
                    if (validationMessage) {
                        dbInput.validationMessage = validationMessage;
                        return;
                    }
                    dbInput.validationMessage = undefined;
                });
                dbInput.show();
            });

            const colPlaceholder: string = '<collection name>';
            const colInput = vscode.window.createInputBox();
            colInput.title = 'Enter Collection Name';
            colInput.step = 2;
            colInput.totalSteps = 2;
            colInput.value = colPlaceholder;
            const colName = await new Promise((resolve, reject) => {
                colInput.onDidAccept(async () => {
                    const value = colInput.value;
                    colInput.dispose();
                    resolve(value);
                });
                colInput.onDidChangeValue(input => {
                    const validationMessage = InputValidator.validateCollection(input);
                    if (validationMessage) {
                        colInput.validationMessage = validationMessage;
                        return;
                    }
                    colInput.validationMessage = undefined;
                });
                colInput.show();
            });

            // insert db
            try {
                const client = (<InspectorElement>treeItem.item).meta?.client;
                if (!client) {
                    throw 'No DB Client found to create new database';
                }
                await client.db(dbName).createCollection(colName);
                this.fireContentChanged();
                vscode.window.showInformationMessage('Database added');
            } catch (error) {
                vscode.window.showErrorMessage('Could not create the database');
            }
        });
        //mongoExplorer.dropDatabase
        vscode.commands.registerCommand(COMMAND_NAMES.DROP_DATABASE, async (treeItem: InspectorTreeItem) => {
            try {
                await (<InspectorElement>treeItem.item).commands.dropDatabase();
                this.fireContentChanged();
                vscode.window.showInformationMessage(`Dropped the Database`);
            } catch (error) {
                vscode.window.showErrorMessage(`Could not drop the Database`);
            }

        });
        //mongoExplorer.addCollection
        vscode.commands.registerCommand(COMMAND_NAMES.ADD_COLLECTION, async (treeItem: InspectorTreeItem) => {
            const inputPlaceholder: string = '<collection name>';
            const name = await vscode.window.showInputBox({
                value: inputPlaceholder,
                valueSelection: [0, inputPlaceholder.length],
                placeHolder: inputPlaceholder,
                validateInput: (input: string) => {
                    return InputValidator.validateCollection(input, <InspectorElement[]>treeItem.elements);
                }
            });
            try {
                if (!name) {
                    throw 'Name can not be empty';
                }
                await (<InspectorElement>treeItem.item).commands.createCollection(name);
                this.fireContentChanged();
                vscode.window.showInformationMessage(`Collection '${name}' added`);
            } catch (error) {
                vscode.window.showErrorMessage(`Could not create collection '${name}'`);
            }
        });
        //mongoExplorer.dropCollection
        vscode.commands.registerCommand(COMMAND_NAMES.DROP_COLLECTION, async (treeItem: InspectorTreeItem) => {
            try {
                await (<InspectorElement>treeItem.item).commands.dropCollection();
                this.fireContentChanged();
                vscode.window.showInformationMessage(`Collection deleted`);
            } catch (error) {
                vscode.window.showErrorMessage(`Could not drop the collection`);
            }
        });

        //mongoExplorer.insertDocument
        vscode.commands.registerCommand(COMMAND_NAMES.INSERT_DOCUMENT, async (treeItem: InspectorTreeItem) => {
            const document = await vscode.window.showInputBox({
                value: '{ }',
                valueSelection: [1, 2],
                placeHolder: 'json document',
                validateInput: (input) => {
                    if (input.length === 0) {
                        return 'Enter json object';
                    }
                    try {
                        JSON.parse(input);
                    } catch {
                        return 'Not a valid json object';
                    }
                    return null;
                }
            });
            try {
                await (<InspectorElement>treeItem.item).commands.insertOne(JSON.parse(`${document}`));
                this.fireContentChanged();
                vscode.window.showInformationMessage(`Document added`);
            } catch (error) {
                vscode.window.showErrorMessage(`Could not insert the document`);
            }
        });

        // open document
        vscode.commands.registerCommand(COMMAND_NAMES.OPEN_DOCUMENT, async (treeItem: InspectorTreeItem) => {
            const item: InspectorElement = <InspectorElement>treeItem.item;
            if (item.type && item.type === ExtendedTreeNodeTypes.DOCUMENT && item.commands?.findOne) {
                const document = await item.commands.findOne();
                VsCodeHelpers.openFormattedTextInEditor(JSON.stringify(document));
            }
        });

        //mongoExplorer.deleteDocument
        vscode.commands.registerCommand(COMMAND_NAMES.DELETE_DOCUMENT, async (treeItem: InspectorTreeItem) => {
            try {
                await (<InspectorElement>treeItem.item).commands.deleteOne();
                this.fireContentChanged();
                vscode.window.showInformationMessage(`Document deleted`);
            } catch (error) {
                vscode.window.showErrorMessage(`Could not delete the document`);
            }

        });
    }

    private readConfigConnections(): void {
        // get database connections
        const databaseConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('instantMongo');
        const dbConnections: DBConnection[] | undefined = databaseConfig.get('connections');
        if (dbConnections) {
            this.configDbConnections = dbConnections;
        }
    }
}