# qbreader/database

A repository to manage the question database for the qbreader website.
Includes uploading questions, updating metadata, and getting reports.
This repository does **not** host a web server of the database with API endpoints - see qbreader/website for that.
The questions are stored in MongoDB.

## Usage

Please **contact me** @geoffrey-wu if you want access to the database.
As this repository involves modifying the contents of the database, I need to know who you are in order to give you credentials to the database.

1) Run `npm install`
2) Run whichever file you're interested in using `node`.
The mongodb-modify.js file requires you to list the functions you want to call inside the file before running it.
