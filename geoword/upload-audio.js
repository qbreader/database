import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const database = client.db('geoword');
const audio = database.collection('audio');
const packets = database.collection('packets');
const sampleAudio = database.collection('sample-audio');
const tossups = database.collection('tossups');

/**
 * Upload the audio from a packet.
 * Requires the questions from the packet to be uploaded first (see `upload-packets.js`).
 * @param {string} packetName
 * @param {string} [extension='mp3']
 * @param {string} [packetDirectory='./']
 */
async function uploadAudio (packetName, extension = 'mp3', packetDirectory = './') {
  const divisions = fs.readdirSync(`${packetDirectory}/${packetName}`).filter(division => !division.includes('.'));

  const sampleFile = fs.readFileSync(`${packetDirectory}/${packetName}/sample.${extension}`);
  if (sampleFile?.length > 0) {
    const _id = new ObjectId();
    await sampleAudio.insertOne({ _id, audio: sampleFile });
    await packets.updateOne({ name: packetName }, { $set: { sample_audio_id: _id } });
    console.log(`${packetName}: Uploaded sample audio with _id ${_id}`);
  } else {
    throw new Error(`${packetName}: Sample audio does not exist`);
  }

  for (const division of divisions) {
    let counter = 0;

    for (const filename of fs.readdirSync(`${packetDirectory}/${packetName}/${division}`)) {
      if (!filename.endsWith(extension)) {
        continue;
      }
      const questionNumber = parseInt(filename.slice(0, -extension.length - 1));
      if (isNaN(questionNumber)) {
        throw new Error(`${packetName}: ${division} ${filename} is not a valid question number`);
      }
      const _id = new ObjectId();
      const file = fs.readFileSync(`${packetDirectory}/${packetName}/${division}/${filename}`);
      await audio.insertOne({ _id, audio: file });
      await tossups.updateOne({ 'packet.name': packetName, division, questionNumber }, { $set: { audio_id: _id } });
      counter++;
    }

    console.log(`${packetName}: Uploaded ${division} (${counter} files)`);
  }
}

export default uploadAudio;
