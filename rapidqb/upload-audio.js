import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const EXTENSION = '.mp3';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();
console.log('connected to mongodb');

const database = client.db('rapidqb');
const audio = database.collection('audio');
const tossups = database.collection('tossups');

async function uploadPacket ({ tournamentName, packetName, packetNumber, folderPath = './' }) {
  let counter = 0;

  for (const filename of fs.readdirSync(`${folderPath}/${tournamentName}/${packetName}`).sort()) {
    if (!filename.endsWith(EXTENSION)) {
      continue;
    }

    const questionNumber = parseInt(filename.slice(0, -EXTENSION.length));
    const _id = new ObjectId();
    const file = fs.readFileSync(`${folderPath}/${tournamentName}/${packetName}/${filename}`);
    await audio.insertOne({ _id, audio: file });
    await tossups.updateOne(
      { 'tournament.name': tournamentName, 'packet.number': packetNumber, number: questionNumber },
      { $set: { audio_id: _id } }
    );
    counter++;
  }

  console.log(`Uploaded packet ${packetName} of ${tournamentName} (${counter} files)`);
}

uploadPacket({
  tournamentName: 'dede-allen-1',
  packetName: '1',
  packetNumber: 1,
  folderPath: './'
});
