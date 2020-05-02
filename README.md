# Instant Mongo: Memory Database and Explorer

The Instant Mongo extension eliminates all the time consuming and cumbersome steps of installing, configuring and running a MongoDB database.
It also adds a Database Explorer to VS Code so you can immediately explore the structures and contents of the database. The Explorer supports basic commands which allow you to create databases, collections and insert documents.

## Installation

After installing, launch the server by running `Instant Mongo: Start DB Server` from the Command Palette (`⇧⌘P`).
You can also navigate to the Database Explorer view and start the server or go through your own databases by adding them to the `.vscode/settings.json` file

## Features

Creates an in-memory Mongo Database for quick developing. When the server is stopped the database is deleted so it doesn't take up any unnecessary space on your system. When clicking on the server status in VS Code Status Bar, a menu with actions regarding the current running Database will be presented.
![Running Database actions](https://raw.githubusercontent.com/hansvn/vscode-instant-mongo/master/resources/images/db_actions.png)

Adds a Database Explorer to the VS Code Activity Bar, where you can open the running memory database in the Side Bar. You can also add your own database URIs to the connections array in the settings and list them in the Explorer.

![Instant DB Server and DB Explorer](https://raw.githubusercontent.com/hansvn/vscode-instant-mongo/master/resources/images/explorer_server.gif)

The Database Explorer includes basic commands to create/drop databases, collections and documents.
![Add Database Command](https://raw.githubusercontent.com/hansvn/vscode-instant-mongo/master/resources/images/command_add_db.gif)
![Create Collection Command](https://raw.githubusercontent.com/hansvn/vscode-instant-mongo/master/resources/images/command_create_coll.gif)
![Insert Document Command](https://raw.githubusercontent.com/hansvn/vscode-instant-mongo/master/resources/images/command_insert_doc.gif)

## Requirements

There are no specific requirements to run this extension.
This extension uses [mongodb-memory-server-core](https://github.com/nodkz/mongodb-memory-server), which tries to download `mongod` upon server start if it cannot find the binary.
Additionally, [mongodb-topology](https://github.com/zhaoyi0113/mongodb-topology) is being used to inspect the databases.

## Extension Settings

This extension contributes the following settings:

- `instantMongo.port`: Set The Database Port
- `instantMongo.ip`: Database IP - for binding to all IP addresses set it to `::,0.0.0.0` (default: 127.0.0.1)
- `instantMongo.dbName`: Generated Database Name (default: random)
- `instantMongo.dbPath`: Database Path - Default in temp directory
- `instantMongo.storageEngine`: available engines: [ 'devnull', 'ephemeralForTest', 'mmapv1', 'wiredTiger' ] (default: ephemeralForTest)
- `instantMongo.replSet`: Replica set name (default: null)
- `instantMongo.auth`: start `mongod` with '--auth' (default `mongod --noauth`)
- `instantMongo.args`: any additional command line arguments for `mongod` (ex. ['--notablescan'])
- `instantMongo.connections`: objects containing a name and connection URI for a MongoDB

## Known Issues

If you know about an issue that needs addressing, check the Github issues first and create one if it wasn't reported yet.

## Release Notes

### [1.0.2] - 2020-04-24

Adds more commands to the Database Explorer.

### [1.0.0] - 2020-04-24

Adds a Database Explorer in the VS Code Side Bar.

### [0.0.1] - 2020-04-07

The initial release was tested in VS Code on MacOS.
