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


function sanitizeString(string) {
    return string
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[\u2018-\u201B]/g, '\'')
        .replace(/[\u201C-\u201F]/g, '"')
        .replace(/[\u2026]/g, '...')
        .replace(/[\u2032-\u2037]/g, '\'')
        .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
        .replace(/\u0142/g, 'l'); // ł -> l
}

/**
 * Upload a packet without deleting existing `_id` references.
 * Creates new packets _as needed_.
 * @param {object} params
 * @param {string} params.setName
 * @param {string} params.packetName
 * @param {number} params.packetNumber
 * @param {boolean} params.zeroIndexQuestions - whether question numbering starts at 0 or 1. Defaults to 1.
 * @param {string} params.folderPath - the folder that the packet is in. Defaults to the current directory.
 * @param {boolean} params.shiftPacketNumbers - whether to shift the packet numbers of existing packets. Defaults to `false`.
 */
async function upsertPacket({ setName, packetName, packetNumber, zeroIndexQuestions, folderPath = './', shiftPacketNumbers = false }) {
    const tossupBulk = tossups.initializeUnorderedBulkOp();
    const bonusBulk = bonuses.initializeUnorderedBulkOp();

    const data = JSON.parse(fs.readFileSync(`${folderPath}/${packetName}.json`));
    let packetAlreadyExists = false;

    const set = await sets.findOne({ name: setName });
    const packet = await packets.findOne({ 'set._id': set._id, number: packetNumber });

    if (shiftPacketNumbers) {
        console.log(await tossups.updateMany({ set_id: set._id, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
        console.log(await bonuses.updateMany({ set_id: set._id, packetNumber: { $gte: packetNumber } }, { $inc: { packetNumber: 1 } }));
        console.log(await packets.updateMany({ 'set._id': set._id, number: { $gte: packetNumber } }, { $inc: { number: 1 } }));
    } else if (packet) {
        packetAlreadyExists = true;
    }

    const packet_id = packetAlreadyExists ? packet._id : new ObjectId();

    if (packetAlreadyExists) {
        await packets.updateOne({ _id: packet_id }, { $set: { name: packetName } });
        await tossups.updateMany({ 'packet._id': packet_id }, { $set: { 'packet.name': packetName } });
        await bonuses.updateMany({ 'packet._id': packet_id }, { $set: { 'packet.name': packetName } });
    } else {
        await packets.insertOne({ _id: packet_id, name: packetName, number: packetNumber, set: { _id: set._id, name: setName } });
    }

    const tossupCount = await tossups.countDocuments({ packet_id: packet_id });

    data.tossups.forEach(async (tossup, index) => {
        const number = zeroIndexQuestions ? index : index + 1;

        tossup.question = tossup.question.replace(/ {2,}/g, ' ');
        tossup.question_sanitized = sanitizeString(tossup.question_sanitized.replace(/ {2,}/g, ' '));
        tossup.answer = tossup.answer.replace(/ {2,}/g, ' ');
        tossup.answer_sanitized = sanitizeString(tossup.answer_sanitized.replace(/ {2,}/g, ' '));

        const updateDoc = {
            $set: {
                question: tossup.question,
                question_sanitized: tossup.question_sanitized,
                answer: tossup.answer,
                answer_sanitized: tossup.answer_sanitized,
                updatedAt: new Date(),
                category: tossup.category,
                subcategory: tossup.subcategory,
            },
            $unset: {
                reports: '',
            },
        };

        if (tossup.alternate_subcategory) {
            updateDoc.$set.alternate_subcategory = tossup.alternate_subcategory;
        }

        if (index < tossupCount && packetAlreadyExists) {
            const { _id } = await tossups.findOneAndUpdate({ 'packet._id': packet_id, number: number }, updateDoc);
            if (tossup.alternate_subcategory) {
                await tossupData.updateMany(
                    { tossup_id: _id },
                    { $set: { category: tossup.category, subcategory: tossup.subcategory, alternate_subcategory: tossup.alternate_subcategory } },
                );
            } else {
                await tossupData.updateMany(
                    { tossup_id: _id },
                    { $set: { category: tossup.category, subcategory: tossup.subcategory } },
                );
            }
        } else {
            tossupBulk.insert({
                ...updateDoc.$set,
                number: number,
                createdAt: new Date(),
                difficulty: set.difficulty,
                packet: {
                    _id: packet_id,
                    name: packetName,
                    number: packetNumber,
                },
                set: {
                    _id: set._id,
                    name: setName,
                    year: set.year,
                    standard: set.standard,
                },
            });
        }
    });

    const bonusCount = await bonuses.countDocuments({ packet_id: packet_id });

    data.bonuses.forEach(async (bonus, index) => {
        const number = zeroIndexQuestions ? index : index + 1;

        bonus.leadin = bonus.leadin.replace(/ {2,}/g, ' ');
        bonus.leadin_sanitized = sanitizeString(bonus.leadin_sanitized.replace(/ {2,}/g, ' '));

        for (let i = 0; i < bonus.parts.length; i++) {
            bonus.parts[i] = bonus.parts[i].replace(/ {2,}/g, ' ');
            bonus.parts_sanitized[i] = sanitizeString(bonus.parts_sanitized[i].replace(/ {2,}/g, ' '));
        }

        for (let i = 0; i < bonus.answers.length; i++) {
            bonus.answers[i] = bonus.answers[i].replace(/ {2,}/g, ' ');
            bonus.answers_sanitized[i] = sanitizeString(bonus.answers_sanitized[i].replace(/ {2,}/g, ' '));
        }

        const updateDoc = {
            $set: {
                leadin: bonus.leadin,
                leadin_sanitized: bonus.leadin_sanitized,
                parts: bonus.parts,
                parts_sanitized: bonus.parts_sanitized,
                answers: bonus.answers,
                answers_sanitized: bonus.answers_sanitized,
                updatedAt: new Date(),
                category: bonus.category,
                subcategory: bonus.subcategory,
            },
            $unset: {
                reports: '',
            },
        };

        if (bonus.alternate_subcategory) {
            updateDoc.$set.alternate_subcategory = bonus.alternate_subcategory;
        }

        if (bonus.values) {
            updateDoc.$set.values = bonus.values;
        }

        if (bonus.difficultyModifiers) {
            updateDoc.$set.difficultyModifiers = bonus.difficultyModifiers;
        }

        if (index < bonusCount && packetAlreadyExists) {
            const { _id } = await bonuses.findOneAndUpdate({ packet_id: packet_id, number: number }, updateDoc);
            if (bonus.alternate_subcategory) {
                await bonusData.updateMany(
                    { bonus_id: _id },
                    { $set: { category: bonus.category, subcategory: bonus.subcategory, alternate_subcategory: bonus.alternate_subcategory } },
                );
            } else {
                await bonusData.updateMany(
                    { bonus_id: _id },
                    { $set: { category: bonus.category, subcategory: bonus.subcategory } },
                );
            }
        } else {
            bonusBulk.insert({
                ...updateDoc.$set,
                number: number,
                createdAt: new Date(),
                difficulty: set.difficulty,
                packet: {
                    _id: packet_id,
                    name: packetName,
                    number: packetNumber,
                },
                set: {
                    _id: set._id,
                    name: setName,
                    year: set.year,
                    standard: set.standard,
                },
            });
        }
    });

    if (tossupBulk.length > 0) {
        console.log(`tossupBulk: ${tossupBulk.length}`);
        await tossupBulk.execute();
    }

    if (bonusBulk.length > 0) {
        console.log(`bonusBulk: ${bonusBulk.length}`);
        await bonusBulk.execute();
    }

    console.log('done');
}


/**
 *
 * @param {string} setName
 * @param {number} difficulty
 * @param {boolean} [standard=true]
 * @param {boolean} [zeroIndexQuestions=false] - whether question numbering starts at 0 or 1. Defaults to 1.
 * @param {string} [folderPath='./'] - the folder that the set is in. Defaults to the current directory.
 * @returns {Promise<boolean>} whether the set existed before updating
 */
async function upsertSet(setName, difficulty, standard = true, zeroIndexQuestions = false, folderPath = './') {
    let setAlreadyExists = await sets.countDocuments({ name: setName });
    setAlreadyExists = !!setAlreadyExists;

    if (!setAlreadyExists) {
        console.log(`Set ${setName} does not exist`);
        setAlreadyExists = false;
        await sets.insertOne({ _id: new ObjectId(), name: setName, year: parseInt(setName.slice(0, 4)), difficulty: difficulty, standard: standard });
    }

    let packetNumber = 0;

    for (const fileName of fs.readdirSync(`${folderPath}/${setName}`).sort()) {
        if (!fileName.endsWith('.json')) {
            return;
        }

        const packetName = fileName.slice(0, -5);
        packetNumber++;

        await upsertPacket({ setName, packetName, packetNumber, zeroIndexQuestions, folderPath: `${folderPath}/${setName}` });
        console.log(`Uploaded ${setName} Packet ${packetName}`);
    }

    return setAlreadyExists;
}

export { upsertPacket, upsertSet };

// await upsertPacket({ setName: '', packetName: '', packetNumber: 1, shiftPacketNumbers: true });
// console.log(await upsertSet(''));
