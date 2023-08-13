import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const database = client.db('qbreader');

const bonuses = database.collection('bonuses');
const packets = database.collection('packets');
const sets = database.collection('sets');
const tossups = database.collection('tossups');

async function uploadPacket(setName, packetName, packetNumber, shiftPacketNumbers = true) {
    const data = JSON.parse(fs.readFileSync(`${packetName}.json`));

    const set_id = await sets.findOne({ name: setName }).then(set => {
        return set._id;
    });

    let packet_id = new ObjectId();

    if (!shiftPacketNumbers) {
        packet_id = await packets.findOne({ name: setName, number: packetNumber }).then(packet => packet._id);
    }

    if (shiftPacketNumbers) {
        console.log(await tossups.updateMany({ set_id: set_id, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
        console.log(await bonuses.updateMany({ set_id: set_id, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
        console.log(await packets.updateMany({ 'set._id': set_id, number: { $gte: packetNumber } }, { $inc: { number: 1 } }));
    } else {
        console.log(await tossups.deleteMany({ set_id: set_id, packet_id: packet_id }));
        console.log(await bonuses.deleteMany({ set_id: set_id, packet_id: packet_id }));
        console.log(await packets.deleteOne({ _id: packet_id }));
    }

    await packets.insertOne({ _id: packet_id, name: packetName, number: packetNumber, set: { _id: set_id, name: setName } });

    data.tossups.forEach(async (tossup, index) => {
        tossup.question = tossup.question
            .replace(/\t/g, ' ')
            .replace(/ {2,}/g, ' ')
            .trim();

        tossup.answer = tossup.answer
            .replace(/\t/g, ' ')
            .replace(/ {2,}/g, ' ')
            .trim();

        if (tossup.formatted_answer) {
            tossup.formatted_answer = tossup.formatted_answer
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        tossup._id = new ObjectId();
        tossup.packet_id = packet_id;
        tossup.set_id = set_id;
        tossup.setName = setName;
        tossup.type = 'tossup';
        tossup.packetNumber = packetNumber;
        tossup.packetName = packetName;
        tossup.questionNumber = tossup.questionNumber || (index + 1);
        tossup.createdAt = tossup.createdAt || new Date();
        tossup.updatedAt = tossup.updatedAt || new Date();
        await tossups.insertOne(tossup);
    });

    data.bonuses.forEach(async (bonus, index) => {
        for (let i = 0; i < bonus.parts.length; i++) {
            bonus.parts[i] = bonus.parts[i]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        for (let i = 0; i < bonus.answers.length; i++) {
            bonus.answers[i] = bonus.answers[i]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        for (let i = 0; i < bonus?.formatted_answers.length ?? 0; i++) {
            bonus.formatted_answers[i] = bonus.formatted_answers[i]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        bonus._id = new ObjectId();
        bonus.packet_id = packet_id;
        bonus.set_id = set_id;
        bonus.setName = setName;
        bonus.type = 'bonus';
        bonus.packetNumber = packetNumber;
        bonus.packetName = packetName;
        bonus.questionNumber = bonus.questionNumber || (index + 1);
        bonus.createdAt = bonus.createdAt || new Date();
        bonus.updatedAt = bonus.updatedAt || new Date();
        await bonuses.insertOne(bonus);
    });
}

export default uploadPacket;
