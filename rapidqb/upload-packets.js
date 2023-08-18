import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();
console.log('connected to mongodb');

const database = client.db('rapidqb');
const packets = database.collection('packets');
const tossups = database.collection('tossups');
const tournaments = database.collection('tournaments');

async function uploadPacket({ tournamentName, packetName, packetNumber, folderPath = './' }) {
    const tournament = await tournaments.findOne({ name: tournamentName });
    console.log(await packets.deleteMany({ 'tournament._id': tournament._id, number: packetNumber }));
    const packet_id = new ObjectId();
    await packets.insertOne({ _id: packet_id, name: packetName, number: packetNumber, tournament: { _id: tournament._id, name: tournamentName } });
    const data = JSON.parse(fs.readFileSync(`${folderPath}/${packetName}.json`));
    data.tossups.forEach((tossup, index) => {
        tossup.packet = {
            _id: packet_id,
            name: packetName,
            number: packetNumber,
        };
        tossup.tournament = {
            _id: tournament._id,
            name: tournamentName,
        };
        tossup.number = index + 1;
    });

    console.log(await tossups.insertMany(data.tossups));
}

async function uploadTournament({ tournamentName, folderPath = './' }) {
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
            tournamentName: tournamentName,
            packetName: packetName,
            packetNumber: packetNumber,
            folderPath: `${folderPath}/${tournamentName}`,
        });

        console.log(`Uploaded ${tournamentName} Packet ${packetName}`);
    }
}

uploadTournament({ tournamentName: 'dede-allen-1', folderPath: './' });
