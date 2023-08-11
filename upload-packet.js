import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const setName = '2011 ACF Nationals';
const packetNumber = 21;
const packetName = 'UCLAASUIllinoisBCMU';
const shiftPacketNumbers = false;

const data = JSON.parse(fs.readFileSync(`${packetName}.json`));

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    const database = client.db('qbreader');
    const sets = database.collection('sets');
    const tossups = database.collection('tossups');
    const bonuses = database.collection('bonuses');

    const setID = await sets.findOne({ name: setName }).then(set => {
        return set._id;
    });

    let packetID = new ObjectId();

    if (!shiftPacketNumbers) {
        packetID = await sets.findOne({ name: setName }).then(async set => {
            if (set.packets.length + 1 == packetNumber) {
                const id = new ObjectId();
                await sets.updateOne({ name: setName }, { $push: { packets: { _id: id, name: packetName, tossups: [], bonuses: [] } } });
                return id;
            } else if (set.packets.length < packetNumber) {
                throw new Error('Packet number is too high');
            }

            return set.packets[packetNumber - 1]._id;
        });
    }

    if (shiftPacketNumbers) {
        console.log(await tossups.updateMany({ set: setID, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
        console.log(await bonuses.updateMany({ set: setID, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
    } else {
        console.log(await tossups.deleteMany({ set: setID, packet: packetID }));
        console.log(await bonuses.deleteMany({ set: setID, packet: packetID }));
    }

    const packet = {
        tossups: [],
        bonuses: [],
    };

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
        tossup.packet = packetID;
        tossup.set = setID;
        tossup.setName = setName;
        tossup.type = 'tossup';
        tossup.packetNumber = packetNumber;
        tossup.packetName = packetName;
        tossup.questionNumber = tossup.questionNumber || (index + 1);
        tossup.createdAt = tossup.createdAt || new Date();
        tossup.updatedAt = tossup.updatedAt || new Date();
        await tossups.insertOne(tossup);
        packet.tossups.push(tossup._id);
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
        bonus.packet = packetID;
        bonus.set = setID;
        bonus.setName = setName;
        bonus.type = 'bonus';
        bonus.packetNumber = packetNumber;
        bonus.packetName = packetName;
        bonus.questionNumber = bonus.questionNumber || (index + 1);
        bonus.createdAt = bonus.createdAt || new Date();
        bonus.updatedAt = bonus.updatedAt || new Date();
        await bonuses.insertOne(bonus);
        packet.bonuses.push(bonus._id);
    });

    if (shiftPacketNumbers) {
        console.log(await sets.updateOne(
            { _id: setID },
            { $push: {
                packets: {
                    $each: [{
                        _id: packetID,
                        name: packetName,
                        tossups: packet.tossups,
                        bonuses: packet.bonuses,
                    }],
                    $position: packetNumber - 1,
                }
            } },
        ));
    } else {
        console.log(await sets.updateOne(
            { _id: setID },
            { $set: {
                [`packets.${packetNumber - 1}.tossups`]: packet.tossups,
                [`packets.${packetNumber - 1}.bonuses`]: packet.bonuses,
            } },
        ));
    }
});
