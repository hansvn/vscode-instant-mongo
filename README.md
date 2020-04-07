# instant-mongo README

The Instant Mongo extension eliminates all the time consuming and cumbersome steps of installing, configuring and running a MongoDB database.
Just start your devving session: quickly run a database without any setup and focus on the important matters.

This extension is a wrapper for [mongodb-memory-server-core](https://github.com/nodkz/mongodb-memory-server) so you can spin up a database with one command (or 2 clicks).

## Installation

After installing, launch the server by running `Instant Mongo: Start DB Server` from the Command Palette (`⇧⌘P`).

## Features

Creates an in-memory Mongo Database for quick developing. When the server is stopped the database is deleted so it doesn't take up any unnecessary space on your system.

## Requirements

There are no specific requirements to run this extension.
This extension uses [mongodb-memory-server-core](https://github.com/nodkz/mongodb-memory-server), which tries to download `mongod` upon server start if it cannot find the binary.

## Extension Settings

This extension contributes the following settings:

- `instantMongo.port`: Set The Database Port
- `instantMongo.ip`: Database IP - for binding to all IP addresses set it to `::,0.0.0.0` (default: 127.0.0.1)
- `instantMongo.dbName`: Generated Database Name (default: random)
- `instantMongo.dbPath`: Database Path - Default in temp directory
- `instantMongo.storageEngine`: available engines: [ 'devnull', 'ephemeralForTest', 'mmapv1', 'wiredTiger' ] (default: ephemeralForTest)
- `instantMongo.replSet`: Replica set name (default: null)
- `instantMongo.auth`: start `mongod` with '--auth' (default `mongod --noauth`)
- `instantMongo.args`: any additional command line arguments for `mongod` `mongod` (ex. ['--notablescan'])

## Known Issues

If you know about an issue that needs addressing, check the Github issues first and create one if it wasn't reported yet.

## Release Notes

### [0.0.1] - 2020-04-07

The initial release was tested in VS Code on MacOS.
