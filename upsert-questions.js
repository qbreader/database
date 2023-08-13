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

const accountInfo = client.db('account-info');

const tossupData = accountInfo.collection('tossup-data');
const bonusData = accountInfo.collection('bonus-data');

/**
 * Upload a packet without deleting existing `_id` references.
 * Creates new packets _as needed_.
 * @param {object} params
 * @param {string} params.setName
 * @param {string} params.packetName
 * @param {number} params.packetNumber
 * @param {string} params.folderPath - the folder that the packet is in. Defaults to the current directory.
 * @param {boolean} params.shiftPacketNumbers - whether to shift the packet numbers of existing packets. Defaults to `false`.
 */
async function upsertPacket({ setName, packetName, packetNumber, folderPath = './', shiftPacketNumbers = false }) {
    const tossupBulk = tossups.initializeUnorderedBulkOp();
    const bonusBulk = bonuses.initializeUnorderedBulkOp();

    const data = JSON.parse(fs.readFileSync(`${folderPath}/${packetName}.json`));
    let packetAlreadyExists = false;

    const set = await sets.findOne({ name: setName });
    const packet = await packets.findOne({ 'set._id': set._id, number: packetNumber });

    let packet_id = new ObjectId();

    if (shiftPacketNumbers) {
        console.log(await tossups.updateMany({ set_id: set._id, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
        console.log(await bonuses.updateMany({ set_id: set._id, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
        console.log(await packets.updateMany({ 'set._id': set._id, number: { $gte: packetNumber } }, { $inc: { number: 1 } }));
    } else if (packet) {
        packetAlreadyExists = true;
        packet_id = packet._id;
    }

    if (packetAlreadyExists) {
        await packets.updateOne({ _id: packet_id }, { $set: { name: packetName } });
    } else {
        await packets.insertOne({ _id: packet_id, name: packetName, number: packetNumber, set: { _id: set._id, name: setName } });
    }

    const tossupCount = await tossups.countDocuments({ packet_id: packet_id });

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

        const updateDoc = {
            $set: {
                question: tossup.question,
                answer: tossup.answer,
                formatted_answer: tossup.formatted_answer,
                updatedAt: new Date(),
                category: tossup.category,
                subcategory: tossup.subcategory,
                packetName: packetName,
            },
            $unset: {
                reports: '',
            }
        };

        if (index < tossupCount && packetAlreadyExists) {
            const { _id } = await tossups.findOneAndUpdate({ packet_id: packet_id, questionNumber: index + 1 }, updateDoc);
            await tossupData.updateMany({ tossup_id: _id }, { $set: { category: tossup.category, subcategory: tossup.subcategory } });
        } else {
            tossupBulk.insert({
                packet_id: packet_id,
                questionNumber: index + 1,
                set_id: set._id,
                type: 'tossup',
                createdAt: new Date(),
                packetNumber: packetNumber,
                setName: setName,
                setYear: set.year,
                difficulty: set.difficulty,
                ...updateDoc.$set,
            });
        }
    });

    const bonusCount = await bonuses.countDocuments({ packet_id: packet_id });

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

        const updateDoc = {
            $set: {
                leadin: bonus.leadin,
                parts: bonus.parts,
                answers: bonus.answers,
                formatted_answers: bonus.formatted_answers,
                updatedAt: new Date(),
                category: bonus.category,
                subcategory: bonus.subcategory,
                packetName: packetName,
            },
            $unset: {
                reports: '',
            }
        };

        if (bonus.values) {
            updateDoc.$set.values = bonus.values;
        }

        if (bonus.difficulties) {
            updateDoc.$set.difficulties = bonus.difficulties;
        }

        if (index < bonusCount && packetAlreadyExists) {
            const { _id } = await bonuses.findOneAndUpdate({ packet_id: packet_id, questionNumber: index + 1 }, updateDoc);
            await bonusData.updateMany({ bonus_id: _id }, { $set: { category: bonus.category, subcategory: bonus.subcategory } });
        } else {
            bonusBulk.insert({
                packet_id: packet_id,
                questionNumber: index + 1,
                set_id: set._id,
                type: 'bonus',
                createdAt: new Date(),
                packetNumber: packetNumber,
                setName: setName,
                setYear: set.year,
                difficulty: set.difficulty,
                ...updateDoc.$set,
            });
        }
    });

    if (tossupBulk.length > 0) {
        console.log(await tossupBulk.execute());
    }

    if (bonusBulk.length > 0) {
        console.log(await bonusBulk.execute());
    }

    console.log('done');
}


/**
 *
 * @param {string} setName
 * @param {string} folderPath - the folder that the set is in. Defaults to the current directory.
 * @returns {Promise<boolean>} whether the set existed before updating
 */
async function upsertSet(setName, folderPath = './') {
    let setAlreadyExists = await sets.countDocuments({ name: setName });
    setAlreadyExists = !!setAlreadyExists;

    if (!setAlreadyExists) {
        console.log(`Set ${setName} does not exist`);
        setAlreadyExists = false;
        await sets.insertOne({ _id: new ObjectId(), name: setName, year: parseInt(setName.slice(0, 4)) });
    }

    let packetNumber = 0;

    for (const fileName of fs.readdirSync(`${folderPath}/${setName}`).sort()) {
        if (!fileName.endsWith('.json')) {
            return;
        }

        const packetName = fileName.slice(0, -5);
        packetNumber++;

        await upsertPacket({ setName: setName, packetName: packetName, packetNumber: packetNumber, folderPath: `${folderPath}/${setName}` });
        console.log(`Uploaded ${setName} Packet ${packetName}`);
    }

    return setAlreadyExists;
}

export { upsertPacket, upsertSet };

// await upsertPacket({ setName: '', packetName: '', packetNumber: 1, shiftPacketNumbers: true });
// console.log(await upsertSet(''));
