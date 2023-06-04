#!/bin/bash

# Dump all databases in the cluster to generate a backup
# mongodump and bsondump can be installed from the MongoDB Database Tools

# .env should be a file with the MONGODB_USERNAME and MONGODB_PASSWORD in the same directory as this file
# defined as bash variables (a standard .env file should do the trick)
source .env
mongodump --uri="mongodb+srv://${MONGODB_USERNAME}:${MONGODB_PASSWORD}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority"
