import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const PACKET_DIRECTORY = 'packets/';
const EXTENSION = '.mp3';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    const database = client.db('geoword');
    const audio = database.collection('audio');
    const tossups = database.collection('tossups');

    for (const packetName of fs.readdirSync(PACKET_DIRECTORY)) {
        if (packetName === '.DS_Store') {
            continue;
        }

        console.log('Uploading', packetName);

        for (const division of fs.readdirSync(PACKET_DIRECTORY + packetName)) {
            if (division === '.DS_Store' || division === 'sample.mp3') {
                continue;
            }

            if (!['High School', 'Division 1', 'Division 2'].includes(division)) {
                console.log('wrong division:', division);
                continue;
            }

            let counter = 0;

            for (const filename of fs.readdirSync(PACKET_DIRECTORY + packetName + '/' + division)) {
                if (!filename.endsWith(EXTENSION)) {
                    continue;
                }

                const questionNumber = parseInt(filename.slice(0, -EXTENSION.length));
                const _id = new ObjectId();
                const file = fs.readFileSync(PACKET_DIRECTORY + packetName + '/' + division + '/' + filename);
                await audio.insertOne({ _id: _id, audio: file });
                await tossups.updateOne({ packetName, division, questionNumber }, { $set: { audio_id: _id } });
                counter++;
            }

            console.log(`Uploaded ${division} of ${packetName} (${counter} files)`);
        }
    }
});
