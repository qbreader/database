# qbreader/database

A repository to manage the question database for the qbreader website.
Includes uploading questions, updating metadata, and getting reports.
This repository does **not** host a web server of the database with API endpoints - see qbreader/website for that.
The questions are stored in MongoDB.

## Obtaining Questions

If you want to obtain a copy of all the questions on the database, you may be interested in downloading the [latest backup](https://www.qbreader.org/backups).
I ask that any software you develop using this question also uses a copyleft license.

**Note:** Since I have obtained all of these questions from https://quizbowlpackets.com/, you should follow their disclaimer:

> Everything posted here is copyright the writers and tournament hosts. Not the archives. It is illegal to make money from the use or sale of these questions without the explicit permission of the owners.

## Usage

Please **contact me** on discord at [thedoge#1189](https://discord.com/users/298250592135020545) if you want edit access to the database.
As this repository involves modifying the contents of the database, I need to know who you are in order to give you credentials.
If you're interested in running the website or building your own app, I can give you read-only access.

1. Run `npm install`
2. Run whichever file you're interested in using `node`.
   The mongodb-modify.js file requires you to list the functions you want to call inside the file before running it.
