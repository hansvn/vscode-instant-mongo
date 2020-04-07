// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { writeSync as copyToClipboard } from 'clipboardy';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { MongoMemoryInstancePropT } from 'mongodb-memory-server-core/lib/types';
import { StatusBar } from './status-bar';
import { VsCodeHelper } from './vscode_helper';

enum COMMANDS {
	START = 'instant-mongo.start',
	STOP = 'instant-mongo.stop',
	SHOW_MENU = 'instant-mongo.show_menu',
	SHOW_INFO = 'instant-mongo.info',
	COPY_URI = 'instant-mongo.copy_uri'
}

let mongoServer: MongoMemoryServer;
let statusBar: StatusBar;

export function activate(context: vscode.ExtensionContext) {
	const showMenuCommand = vscode.commands.registerCommand(COMMANDS.SHOW_MENU, async () => {
		await showMenu();
	});

	const startCommand = vscode.commands.registerCommand(COMMANDS.START, async () => {
		await startServer();
	});

	const stopCommand = vscode.commands.registerCommand(COMMANDS.STOP, async () => {
		await stopServer();
	});

	context.subscriptions.push(showMenuCommand);
	context.subscriptions.push(startCommand);
	context.subscriptions.push(stopCommand);

	// Create status bar item
	statusBar = new StatusBar(context, COMMANDS.SHOW_MENU);
}

// this method is called when your extension is deactivated
export function deactivate() {
	stopServer();
	console.log('Mongo server stopped');
	statusBar.dispose();
}

function updateStatusText(status: string, tooltip?: string): void {
	statusBar.update(status, tooltip);
}

async function startServer() {
	updateStatusText('$(sync~spin) Starting Mongod');

	if (!mongoServer) {
		const configuration = vscode.workspace.getConfiguration('instantMongo');
		mongoServer = new MongoMemoryServer({
			autoStart: false,
			instance: <MongoMemoryInstancePropT>{ ...configuration }
		});
	}

	if (mongoServer.getInstanceInfo()) {
		console.log('found a running server - starting a new one');
		// server is running - stop it
		await mongoServer.stop();
	}

	console.log('starting server');
	await mongoServer.start();

	const port = await mongoServer.getPort();

	// update status bar
	updateStatusText('$(database) Mongod Running', 'mongod options');
	// Display a message box to the user
	VsCodeHelper.showInfoMessage(`Database is running on port ${port}`);
}

async function stopServer() {
	console.log('stopping mongod server');
	if (mongoServer && mongoServer.getInstanceInfo()) {
		mongoServer.stop();
	} else {
		console.log('server already stopped');
	}

	updateStatusText('$(close) Mongod Stopped', 'click to open actions menu');
	VsCodeHelper.showInfoMessage(`Database stopped`);
}

function printDbInfo(): void {
	if (mongoServer) {
		const dbInfo = mongoServer.getInstanceInfo();
		if (dbInfo) {
			VsCodeHelper.openTextInEditor(`{
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

async function showMenu() {
	let menuItems = [];
	if (mongoServer && mongoServer.getInstanceInfo()) {
		menuItems.push({
			id: COMMANDS.STOP,
			label: 'Stop Server',
		});

		const uri = await mongoServer.getUri();
		menuItems.push({
			id: COMMANDS.COPY_URI,
			label: 'Copy Database URI',
			detail: uri
		});
	} else {
		menuItems.push({
			id: COMMANDS.START,
			label: 'Start Mongo Server',
		});
	}
	menuItems.push({
		id: COMMANDS.SHOW_INFO,
		label: 'Show Info',
		detail: 'Prints info from running instance in an editor window'
	})

	const result = await vscode.window.showQuickPick(menuItems);
	if (result) {
		switch (result.id) {
			case COMMANDS.START:
				await startServer();
				break;
			case COMMANDS.STOP:
				await stopServer();
				break;
			case COMMANDS.COPY_URI:
				copyToClipboard(`${result.detail}`);
				VsCodeHelper.showInfoMessage('Database URI copied to clipboard');
				break;
			case COMMANDS.SHOW_INFO:
				printDbInfo();
				break;
		}
	}
}
