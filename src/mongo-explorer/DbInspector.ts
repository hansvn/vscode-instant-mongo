import * as vscode from 'vscode';
import { MongoClient } from 'mongodb';
import { DBConnection, ExtendedTreeNodeTypes as TreeNodeTypes, InspectorElement } from './types';
const { TreeInspector } = require('mongodb-topology');

type DBTree = {
    databases?: Array<InspectorElement>;
    roles?: Array<InspectorElement>;
    users?: Array<InspectorElement>;
}
const SYSTEM_DBS: Array<string> = [
    'admin',
    'local'
];

export class DbInspector {
    private client: MongoClient;
    private inspector: any;
    public tree: DBTree | undefined;

    public get inspected(): boolean {
        return !!this.tree;
    }

    public get name(): string {
        return this.connection.name;
    }

    public get isConnected(): boolean {
        return this.client.isConnected();
    }

    public get mongoClient(): MongoClient {
        return this.client;
    }

    constructor(private connection: DBConnection) {
        this.client = new MongoClient(connection.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    public destroy(): void {
        this.disconnectDb();
        this.tree = undefined;
    }

    private connectDb(): Promise<MongoClient> {
        return this.client.connect();
    }

    private disconnectDb(): Promise<void> {
        return this.client.close();
    }

    public resetInspection(): void {
        this.tree = undefined;
    }

    private inspectDB(): Promise<any> {
        return this.inspector.inspect({ serverStateChange: false })
    }

    public async inspect(): Promise<void> {
        try {
            await this.createInspector();
            this.tree = await this.normalizeTree(await this.inspectDB());
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to connect to MongoDB '${this.connection.name}'.`);
        }
    }

    private async createInspector(): Promise<void> {
        if (!this.client.isConnected()) {
            this.client = await this.connectDb();
        }
        if (!this.inspector) {
            this.inspector = new TreeInspector(this.client);
        }
    }

    private async normalizeTree(tree: DBTree): Promise<DBTree> {
        return Promise.resolve({
            databases: await this.normalizeDbs(tree.databases),
            roles: await this.normalizeChildren(tree.roles),
            users: await this.normalizeChildren(tree.users),
            meta: {
                client: this.client
            }
        });
    }

    /**
     * Groups the system databases (admin, local) and lists other databases
     *
     * @param {Array<any>} databases - all databases received from the client
     */
    private async normalizeDbs(databases: InspectorElement[] | undefined): Promise<InspectorElement[]> {
        let systemDbs: InspectorElement[] = [];

        if (databases) {
            // remove matching items until no valid index is returned
            let systemDbIndex: number;
            do {
                systemDbIndex = databases?.findIndex(db => SYSTEM_DBS.includes(db.name));
                if (systemDbIndex > -1) {
                    const systemDb = databases.splice(systemDbIndex, 1);
                    systemDbs.push(systemDb[0]);
                }
            } while (systemDbIndex > -1);
        }

        databases?.unshift(
            {
                name: 'System',
                type: TreeNodeTypes.GROUP_SYSTEMDB,
                values: systemDbs,
                meta: {
                    count: systemDbs.length
                }
            }
        );

        return this.normalizeChildren(databases);
    }

    /**
     * Normalizes the database tree
     * * Groups the database indexes and (first 10) collections
     * * Returns all other elements unchanged
     * 
     * @param {Array<any>} items - child items to normalize
     */
    private async normalizeChildren(items: InspectorElement[] | undefined): Promise<InspectorElement[]> {
        let children: Array<any> = [];

        if (items) {
            if (typeof items[Symbol.iterator] === 'function') {
                for (const item of items) {
                    let type: string = item?.type;
                    if (type.includes(':')) {
                        type = type.split(':')[0];
                    }

                    switch (type) {
                        case TreeNodeTypes.DATABASE:
                            item.collections = await this.normalizeChildren(item.collections);
                            item.commands = {
                                createCollection: (name: string) => {
                                    return this.client.db(item.dbName).createCollection(name).then(() => {
                                        this.inspectDB();
                                    });
                                }
                            }
                            children.push(item);
                            break;

                        case TreeNodeTypes.COLLECTION:
                            try {
                                // list first 10 collections
                                let collections = await this.client
                                    .db(item.dbName)
                                    .collection(item.name)
                                    .find()
                                    .sort({ _id: 1 })
                                    .limit(10)
                                    .toArray();
                                collections.map(doc => {
                                    doc.type = TreeNodeTypes.DOCUMENT;
                                    doc.commands = {
                                        findOne: () => {
                                            return this.client.db(item.dbName).collection(item.name).findOne({ _id: doc._id });
                                        }
                                    }
                                    return doc;
                                });

                                const values = [
                                    {
                                        name: 'Indexes',
                                        type: TreeNodeTypes.GROUP_INDEX,
                                        values: item.indexes
                                    },
                                    ...collections
                                ];

                                children.push({
                                    name: item.name,
                                    type: TreeNodeTypes.COLLECTION,
                                    values: values,
                                    meta: {
                                        count: await this.client.db(item.dbName).collection(item.name).countDocuments()
                                    },
                                    commands: {
                                        insertOne: (document: object) => {
                                            return this.client.db(item.dbName).collection(item.name).insertOne(document).then(() => {
                                                this.inspectDB();
                                            });
                                        }
                                    }
                                });
                            } catch (error) {
                                // mongodb client returned an error
                                console.error(error);
                            }
                            break;

                        case TreeNodeTypes.GROUP:
                            children.push(
                                Object.assign(item, {
                                    values: await this.normalizeChildren(item.values)
                                })
                            );
                            break;

                        default:
                            children.push(item);
                            break;
                    }
                }
            } else {
                children.push(
                    await this.normalizeChildren(items)
                );
            }
        }

        return Promise.resolve(children);
    }
}