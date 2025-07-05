import 'dotenv/config';

import { client } from '../core/mongodb-client.js';

import * as fs from 'fs';
import { ObjectId } from 'mongodb';

const database = client.db('rapidqb');
const packets = database.collection('packets');
const tossups = database.collection('tossups');
const tournaments = database.collection('tournaments');

async function uploadPacket ({ tournamentName, packetName, packetNumber, folderPath = './' }) {
  const tournament = await tournaments.findOne({ name: tournamentName });
  console.log(await packets.deleteMany({ 'tournament._id': tournament._id, number: packetNumber }));
  const packet_id = new ObjectId();
  await packets.insertOne({ _id: packet_id, name: packetName, number: packetNumber, tournament: { _id: tournament._id, name: tournamentName } });
  const data = JSON.parse(fs.readFileSync(`${folderPath}/${packetName}.json`));
  data.tossups.forEach((tossup, index) => {
    tossup.packet = {
      _id: packet_id,
      name: packetName,
      number: packetNumber
    };
    tossup.tournament = {
      _id: tournament._id,
      name: tournamentName
    };
    tossup.number = index + 1;
  });

  console.log(await tossups.insertMany(data.tossups));
}

async function uploadTournament ({ tournamentName, folderPath = './' }) {
  const tournament_id = new ObjectId();
  await tournaments.insertOne({ _id: tournament_id, name: tournamentName });
  let packetNumber = 0;
  for (const fileName of fs.readdirSync(`${folderPath}/${tournamentName}`).sort()) {
    if (!fileName.endsWith('.json')) {
      return;
    }

    const packetName = fileName.slice(0, -5);
    packetNumber++;

    await uploadPacket({
      tournamentName,
      packetName,
      packetNumber,
      folderPath: `${folderPath}/${tournamentName}`
    });

    console.log(`Uploaded ${tournamentName} Packet ${packetName}`);
  }
}

uploadTournament({ tournamentName: 'dede-allen-1', folderPath: './' });
