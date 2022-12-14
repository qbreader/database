#!/bin/bash

# Dump the database to generate a backup
# mongodump and bsondump can be installed from the MongoDB Database Tools

#.env should be a file with the MONGODB_USERNAME and MONGODB_PASSWORD
# defined as bash variables (a standard .env file should do the trick)
source .env
mongodump --uri="mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority" -d qbreader
mv dump/qbreader $(date +%Y-%m-%d_%H:%M:%S)
rm -r dump
cd $(date +%Y-%m-%d_%H:%M:%S)
bsondump --outFile=questions.json questions.bson
bsondump --outFile=sets.json sets.bson
