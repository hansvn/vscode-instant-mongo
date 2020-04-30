import * as vscode from 'vscode';

import { InstantMongo } from './instant-mongo/instant-mongo';
import { MongoExplorer } from './mongo-explorer/MongoExplorer';
import { EVENTS as MongoServerEvents, MongoServer, SERVER_STATUS } from './instant-mongo/mongo-server/MongoServer';

let instantMongo: InstantMongo;

export function activate(context: vscode.ExtensionContext) {
	instantMongo = new InstantMongo(context);

	const explorer = new MongoExplorer(context);
	// add mongo memory server to database explorer when it is running
	MongoServer.statusEventEmitter.on(MongoServerEvents.STATUS_CHANGE, async (status) => {
		if (status === SERVER_STATUS.RUNNING) {
			explorer.addDbConnection({
				uri: await MongoServer.getServer?.getUri() || '',
				name: 'Memory DB'
			});
		} else if (status === SERVER_STATUS.STOPPED) {
			explorer.removeDbConnection({
				uri: await MongoServer.getServer?.getUri() || '',
				name: 'Memory DB'
			});
		}
	});
}

/**
 * Deactivate the extension
 *
 * @returns {void}
 */
export function deactivate(): void {
	instantMongo.terminate();
	MongoServer.terminate();
}
