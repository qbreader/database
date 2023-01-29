#!/bin/bash

# Restores the database from backups generated by mongodump.

# .env should be a file with the MONGODB_USERNAME and MONGODB_PASSWORD in the same directory as this file
# defined as bash variables (a standard .env file should do the trick)
source .env
mongorestore -d qbreader -c questions --uri="mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority" questions.bson
mongorestore -d qbreader -c sets --uri="mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority" sets.bson