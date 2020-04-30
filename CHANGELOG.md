# Change Log

All notable changes to the "instant-mongo" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [1.0.4] - 2020-05-01

- Revert changes to v1.0.2 as webpack breaks some mongodb functionalities

## [1.0.3] - 2020-04-25

- Configured webpack to bundle the extension before publish

## [1.0.2] - 2020-04-24

- Fixed create collection in existing database command
- Added removeDbConnection command for when the memory server is stopped
- Added Images to README
- Added Drop Database, Drop Collection and Delete Document commands

## [1.0.1] - 2020-04-24

- Added package keyword `Explorer`

## [1.0.0] - 2020-04-24

- Added Database Explorer
- Automatically shows the running Memory Database in the Explorer
- Added additional Database Connections to `.vscode/settings.json`
- Added Icons for the Database Explorer
- Added create and insert commands in the Database Explorer

## [0.0.3] - 2020-04-07

- Prints DB info in an editor window
- Show status bar feedback while spinning up the database

## [0.0.1] - 2020-04-07

- Initial release
- This file to hopefully serve as an up-to-date CHANGELOG
