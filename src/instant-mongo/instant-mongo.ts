import * as vscode from 'vscode';
import { writeSync as copyToClipboard } from 'clipboardy';

import { VsCodeHelpers } from '../vscode-helpers';
import { MongoServer } from './mongo-server/MongoServer';
import { StatusBar } from './status-bar';

export enum COMMAND_NAMES {
    START = 'instant-mongo.start',
    STOP = 'instant-mongo.stop',
    SHOW_MENU = 'instant-mongo.show_menu',
    SHOW_INFO = 'instant-mongo.info',
    COPY_URI = 'instant-mongo.copy_uri'
}

export class InstantMongo {
    private mongoServer: MongoServer;
    private statusBar: StatusBar;

    /**
     * Initializes the extenstions view elements
     *
     * @param {vscode.ExtensionContext} context - The context to register the command to
     * @returns {void}
     */
    constructor(context: vscode.ExtensionContext) {
        // Create server (does not start it)
        this.mongoServer = new MongoServer();

        // Create status bar item
        this.statusBar = new StatusBar(context, COMMAND_NAMES.SHOW_MENU);

        // Register commands
        this.registerCommands(context);
    }

    public terminate(): void {
        this.stopServer().then(() => {
            console.log('Mongo server stopped');
        });
        this.statusBar.dispose();
    }

    /**
    * Registers all vscode commands to the editor context
    *
    * @param {vscode.ExtensionContext} context - The context to register the command to
    * @returns {void}
    */
    private registerCommands(context: vscode.ExtensionContext): void {
        const showMenuCommand = vscode.commands.registerCommand(COMMAND_NAMES.SHOW_MENU, async () => {
            await this.showMenu();
        });

        const startCommand = vscode.commands.registerCommand(COMMAND_NAMES.START, async () => {
            await this.startServer();
        });

        const stopCommand = vscode.commands.registerCommand(COMMAND_NAMES.STOP, async () => {
            await this.stopServer();
        });

        context.subscriptions.push(showMenuCommand);
        context.subscriptions.push(startCommand);
        context.subscriptions.push(stopCommand);
    }

    public async startServer() {
        this.updateStatusText('$(sync~spin) Starting Mongod');

        if (!this.mongoServer) {
            this.mongoServer = new MongoServer();
        }
        if (this.mongoServer.isRunning) {
            console.log('server already running - restarting mongo server');
            await this.mongoServer.stop();
        }

        await this.mongoServer.start();
        const dbPort = await this.mongoServer.getPort();

        // update status bar
        this.updateStatusText('$(database) Mongod Running', 'mongod options');
        // Display a message box to the user
        VsCodeHelpers.showInfoMessage(`Database is running on port ${dbPort}`);
    }

    public async stopServer() {
        this.updateStatusText('$(sync~spin) Stopping Mongod');

        if (this.mongoServer) {
            await this.mongoServer.stop();
        }

        this.updateStatusText('$(close) Mongod Stopped', 'click to open actions menu');
        VsCodeHelpers.showInfoMessage('Database stopped');
    }

    public printDbInfo(): void {
        if (this.mongoServer) {
            const dbInfo = this.mongoServer.getInstanceInfo();
            if (dbInfo) {
                VsCodeHelpers.openFormattedTextInEditor(`{
				"port": ${dbInfo.port},
				"dbName": "${dbInfo.dbName}",
				"ip": "${dbInfo.ip}",
				"storageEngine": "${dbInfo.storageEngine}",
				"replSet": "${dbInfo.replSet}",
				"dbPath": "${dbInfo.dbPath}",
				"uri": "${dbInfo.uri}",
				"mongod_pid": ${dbInfo.childProcess?.pid}
			}`);
            }
        }
    }

    async showMenu() {
        let menuItems = [];
        if (this.mongoServer && this.mongoServer.isRunning) {
            menuItems.push({
                id: COMMAND_NAMES.STOP,
                label: 'Stop Server',
            });

            const uri = await this.mongoServer.getUri();
            menuItems.push({
                id: COMMAND_NAMES.COPY_URI,
                label: 'Copy Database URI',
                detail: uri
            });
        } else {
            menuItems.push({
                id: COMMAND_NAMES.START,
                label: 'Start Mongo Server',
            });
        }
        menuItems.push({
            id: COMMAND_NAMES.SHOW_INFO,
            label: 'Show Info',
            detail: 'Prints info from running instance in an editor window'
        })

        const result = await vscode.window.showQuickPick(menuItems);
        if (result) {
            switch (result.id) {
                case COMMAND_NAMES.START:
                    await this.startServer();
                    break;
                case COMMAND_NAMES.STOP:
                    await this.stopServer();
                    break;
                case COMMAND_NAMES.COPY_URI:
                    copyToClipboard(`${result.detail}`);
                    VsCodeHelpers.showInfoMessage('Database URI copied to clipboard');
                    break;
                case COMMAND_NAMES.SHOW_INFO:
                    this.printDbInfo();
                    break;
            }
        }
    }

    /**
    * Updates the text in the statusbar
    *
    * @returns {void}
    */
    private updateStatusText(status: string, tooltip?: string): void {
        this.statusBar.update(status, tooltip);
    }
}
