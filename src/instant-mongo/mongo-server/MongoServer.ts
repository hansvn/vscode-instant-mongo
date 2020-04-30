import * as vscode from 'vscode';
import * as events from 'events';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { MongoMemoryInstancePropT } from 'mongodb-memory-server-core/lib/types';
import { MongoInstanceDataT } from 'mongodb-memory-server-core/lib/MongoMemoryServer';

export const enum EVENTS {
    STATUS_CHANGE = 'mongoserver:status'
};
export const SERVER_STATUS = {
    STARTING: 'starting',
    RUNNING: 'running',
    STOPPING: 'stopping',
    STOPPED: 'stopped'
}

/**
 * MongoServer provides a class that controls a static Mongo Memory Server
 *
 * @export
 * @class MongoServer
 */
export class MongoServer {
    public static statusEventEmitter: events.EventEmitter = new events.EventEmitter();
    private static vsCodeConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('instantMongo');
    private static server: MongoMemoryServer | undefined;
    private static _status: BehaviorSubject<string> = new BehaviorSubject(SERVER_STATUS.STOPPED);

    public static get status(): BehaviorSubject<string> {
        return MongoServer._status;
    }

    public static get getServer(): MongoMemoryServer | undefined {
        return MongoServer.server;
    }

    /**
    * Returns a boolean with running state of the Memory Server
    *
    * @returns {boolean}
    */
    public get isRunning(): boolean {
        return !!MongoServer.server?.getInstanceInfo() || false;
    }

    public constructor() {
        // emit all status changes
        MongoServer._status.subscribe(status => MongoServer.statusEventEmitter.emit(EVENTS.STATUS_CHANGE, status));
    }

    private setStatus(status: string): void {
        if (Object.values(SERVER_STATUS).includes(status)) {
            MongoServer._status.next(status);
        } else {
            console.error(`<${status}> is not a valid server status`);
        }

    }

    /**
    * Get info about the Mongo Memory Server
    *
    * @returns {MongoInstanceDataT | false}
    */
    public getInstanceInfo(): MongoInstanceDataT | false {
        return MongoServer.server?.getInstanceInfo() || false;
    }

    /**
    * Gets the URI of the running server - returns undefined if server is not running
    *
    * @returns {Promise<string> | undefined}
    */
    public getUri(): Promise<string> | undefined {
        return MongoServer.server?.getUri();
    }

    /**
    * Gets the Database Name of the running server - returns undefined if server is not running
    *
    * @returns {Promise<string> | undefined}
    */
    public getDbName(): Promise<string> | undefined {
        return MongoServer.server?.getDbName();
    }

    /**
    * Gets the port of the running server - returns undefined if server is not running
    *
    * @returns {Promise<number> | undefined}
    */
    public getPort(): Promise<number> | undefined {
        return MongoServer.server?.getPort();
    }

    /**
    * Returns the current status of the server
    * * status is defined in the constant SERVER_STATUS
    *
    * @returns {Promise<status: string>}
    */
    public getStatus(): Promise<string> {
        return MongoServer._status.pipe(
            take(1)
        ).toPromise();
    }

    /**
    * Starts the Mongo Memory Server
    * Restarts the server if it is already running
    *
    * @returns {Promise<MongoServer>}
    */
    public async start(): Promise<MongoServer> {
        this.setStatus(SERVER_STATUS.STARTING);

        if (!MongoServer.server) {
            MongoServer.server = new MongoMemoryServer({
                autoStart: false,
                instance: <MongoMemoryInstancePropT>{ ...MongoServer.vsCodeConfig }
            });
        }

        if (MongoServer.server.getInstanceInfo()) {
            console.log('found a running server - starting a new one');
            // server is running - stop it
            await MongoServer.server.stop();
        }

        console.log('starting server');
        const running = await MongoServer.server.start();

        if (running) {
            this.setStatus(SERVER_STATUS.RUNNING);
        } else {
            this.setStatus(SERVER_STATUS.STOPPED);
        }
        return Promise.resolve(this);
    }

    /**
    * Stops the Mongo Memory Server
    *
    * @returns {Promise<boolean>}
    */
    public async stop(): Promise<boolean> {
        this.setStatus(SERVER_STATUS.STOPPED);
        if (MongoServer.server && MongoServer.server.getInstanceInfo()) {
            return MongoServer.server.stop();
        } else {
            console.log('server already stopped');
            return Promise.resolve(true);
        }
    }

    /**
    * Terminates the static instance
    *
    * @returns {void}
    */
    public static terminate(): void {
        MongoServer.server?.stop();
        MongoServer._status.complete();
        MongoServer.statusEventEmitter.removeAllListeners();
    }
}

