import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const database = client.db('geoword');
const audio = database.collection('audio');
const tossups = database.collection('tossups');

/**
 * Upload the audio from a packet.
 * Requires the questions from the packet to be uploaded first (see `upload-packets.js`).
 * @param {string} packetName
 * @param {string} [extension='mp3']
 * @param {string} [packetDirectory='./']
 */
async function uploadAudio (packetName, extension = 'mp3', packetDirectory = './') {
  const divisions = fs.readdirSync(`${packetDirectory}/${packetName}`).map(division => division.replace('.json', ''));

  for (const division of divisions) {
    let counter = 0;

    for (const filename of fs.readdirSync(`${packetDirectory}/${packetName}/${division}`)) {
      if (!filename.endsWith(extension)) {
        continue;
      }
      const questionNumber = parseInt(filename.slice(0, -extension.length - 1));
      const _id = new ObjectId();
      const file = fs.readFileSync(`${packetDirectory}/${packetName}/${division}/${filename}`);
      await audio.insertOne({ _id, audio: file });
      await tossups.updateOne({ 'packet.name': packetName, division, questionNumber }, { $set: { audio_id: _id } });
      counter++;
    }

    console.log(`Uploaded ${division} of ${packetName} (${counter} files)`);
  }
}

export default uploadAudio;
