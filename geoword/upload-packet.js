import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const database = client.db('geoword');
const packets = database.collection('packets');
const tossupCollection = database.collection('tossups');

/**
 *
 * @param {string} packetName
 * @param {ObjectId} packetId
 * @param {string} division
 * @param {string} [packetDirectory='./']
 */
async function uploadDivision (packetName, packetId, division, packetDirectory = './') {
  const data = JSON.parse(fs.readFileSync(`${packetDirectory}/${packetName}/${division}.json`));
  const { tossups } = data;

  await tossupCollection.deleteMany({ packetName, division });

  for (let index = 0; index < tossups.length; index++) {
    const tossup = tossups[index];

    tossup.question = tossup.question.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
    tossup.answer = tossup.answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();

    if (tossup.formatted_answer) {
      tossup.formatted_answer = tossup.formatted_answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
    }

    tossup.division = tossup.division || division;
    tossup.packet = {
      name: packetName,
      _id: packetId
    };
    tossup.questionNumber = tossup.questionNumber || (index + 1);
  }

  console.log(await tossupCollection.insertMany(tossups));
}

/**
 * Uploads a single packet, deleting any questions under the same packetName that were previously uploaded.
 * The packet should be in a folder with the same name as `packetName` in the `packetDirectory` directory.
 * Each division should be a separate JSON file in the folder corresponding to the questions for that division.
 * @param {string} packetName
 * @param {number} [costInCents=250]
 * @param {*} [packetDirectory='./']
 */
async function uploadPacket (packetName, costInCents = 250, packetDirectory = './') {
  const divisions = fs.readdirSync(`${packetDirectory}/${packetName}`).map(division => division.replace('.json', ''));
  console.log('uploading packet', packetName, 'with divisions', divisions);
  const packetId = new ObjectId();

  for (const division of divisions) {
    await uploadDivision(packetName, packetId, division, packetDirectory);
  }

  console.log(await packets.replaceOne(
    { name: packetName, divisions },
    { _id: packetId, name: packetName, divisions, test: true, active: false, costInCents },
    { upsert: true }
  ));
}

export default uploadPacket;
