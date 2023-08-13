import 'dotenv/config';

import { tossupToString, bonusToString } from './stringify.js';

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { MongoClient, ObjectId } from 'mongodb';

const require = createRequire(import.meta.url);

const cats = require('./subcat-to-cat.json');
const subcats = require('./standardize-subcats.json');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
    client.close();
});

const questionDatabase = client.db('qbreader');
const sets = questionDatabase.collection('sets');
const tossups = questionDatabase.collection('tossups');
const bonuses = questionDatabase.collection('bonuses');
const packets = questionDatabase.collection('packets');

const accountInfo = client.db('account-info');
const tossupData = accountInfo.collection('tossup-data');
const bonusData = accountInfo.collection('bonus-data');
const users = accountInfo.collection('users');

const geoword = client.db('geoword');
const audio = geoword.collection('audio');

function clearReports() {
    tossups.updateMany(
        { reports: { $exists: true } },
        { $unset: { reports: '' } },
    ).then(result => {
        console.log(result);
    });

    bonuses.updateMany(
        { reports: { $exists: true } },
        { $unset: { reports: '' } },
    ).then(result => {
        console.log(result);
    });
}


async function deleteSet(setName) {
    const result = await sets.findOneAndDelete({ name: setName });
    const { _id } = result.value;

    console.log(await tossups.deleteMany({ set: _id }));
    console.log(await bonuses.deleteMany({ set: _id }));
    console.log(await tossupData.deleteMany({ set_id: _id }));
    console.log(await bonusData.deleteMany({ set_id: _id }));
}


function denormalizeSetNames() {
    let counter = 0;
    sets.find({}).forEach(set => {
        counter++;
        if (counter % 10 === 0) {
            console.log(`${counter} ${set.name}`);
        }

        tossups.updateMany(
            { set: set._id },
            { $set: { setName: set.name, updatedAt: new Date() } }
        );
        bonuses.updateMany(
            { set: set._id },
            { $set: { setName: set.name, updatedAt: new Date() } }
        );
    });
}


function denormalizePacketNames() {
    let counter = 0;
    sets.find({}).forEach(set => {
        counter++;
        if (counter % 10 === 0) {
            console.log(`${counter} ${set.name}`);
        }

        for (const packet of set.packets) {
            tossups.updateMany(
                { packet: packet._id },
                { $set: { packetName: packet.name, updatedAt: new Date() } }
            );
            bonuses.updateMany(
                { packet: packet._id },
                { $set: { packetName: packet.name, updatedAt: new Date() } }
            );
        }
    });
}


function denormalizeSetYears() {
    let counter = 0;
    sets.find({}).forEach(set => {
        const setYear = parseInt(set.name.slice(0, 4));

        sets.updateOne({ _id: set._id }, { $set: { year: setYear } });

        tossups.updateMany(
            { set: set._id },
            { $set: { setYear: setYear, updatedAt: new Date() } }
        );

        bonuses.updateMany(
            { set: set._id },
            { $set: { setYear: setYear, updatedAt: new Date() } }
        );

        counter++;
        if (counter % 20 === 0) {
            console.log(`${counter} - (${setYear}) - ${set.name}`);
        }
    });
}


const fixAcceptEither = (() => {
    const removeParentheses = (string) => {
        return string
            .replace(/\([^)]*\)/g, '')
            .replace(/\[[^\]]*\]/g, '');
    };

    const splitMainAnswer = (string) => {
        const bracketsSubAnswer = (string.match(/(?<=\[)[^\]]*(?=\])/g) ?? ['']).pop();
        const parenthesesSubAnswer = (string.match(/(?<=\()[^)]*(?=\))/g) ?? ['']).pop();

        const mainAnswer = removeParentheses(string);

        if (bracketsSubAnswer.length !== 0)
            return { mainAnswer, subAnswer: bracketsSubAnswer };

        for (const directive of ['or', 'prompt', 'antiprompt', 'anti-prompt', 'accept', 'reject', 'do not accept']) {
            if (parenthesesSubAnswer.toLowerCase().startsWith(directive))
                return { mainAnswer, subAnswer: parenthesesSubAnswer };
        }

        return { mainAnswer, subAnswer: '' };
    };

    return async function () {
        let count = 0;
        tossups.find({ formatted_answer: { $regex: /[a-z][A-Z].*[[(]accept either/ } }).forEach(async tossup => {
            const { mainAnswer, subAnswer } = splitMainAnswer(tossup?.formatted_answer ?? '');
            if (mainAnswer.match(/(?<=<u>)[^<]*(?=<\/u>)/g)?.length === 1) {
                await tossups.updateOne(
                    { _id: tossup._id },
                    { $set: {
                        formatted_answer: tossup.formatted_answer.replace(/(?<=[a-z])(?=[A-Z])/, '</u></b> <b><u>'),
                        answer: tossup.answer.replace(/(?<=[a-z])(?=[A-Z])/, ' ')
                    } }
                );

                count++;
                if (count % 50 === 0)
                    console.log(count);
            }
        });
    };
})();


async function fixLeadingColons() {
    console.log(await tossups.countDocuments({ formatted_answer: { $regex: /^:/ } }));
    await tossups.find({ formatted_answer: { $regex: /^:/ } }).forEach(tossup => {
        tossups.updateOne(
            { _id: tossup._id },
            { $set: {
                formatted_answer: tossup.formatted_answer.replace(/^:/, '').trim(),
                answer: tossup.answer.replace(/^:/, '').trim(),
            } }
        );
    });
    console.log('tossups done');

    console.log(await bonuses.countDocuments({ formatted_answers: { $regex: /^:/ } }));
    await bonuses.find({ formatted_answers: { $regex: /^:/ } }).forEach(bonus => {
        bonuses.updateOne(
            { _id: bonus._id },
            { $set: {
                formatted_answers: bonus.formatted_answers.map(answer => answer.replace(/^:/, '').trim()),
                answers: bonus.answers.map(answer => answer.replace(/^:/, '').trim())
            } }
        );
    });
    console.log('bonuses done');
}


function fixPacketOrders() {
    sets.find({}).forEach(set => {
        const correctPackets = [];
        let hasSwap = false;

        for (let i = 0; i < set.packets.length; i++) {
            for (let j = 0; j < set.packets.length; j++) {
                if (parseInt(set.packets[j].name) === i + 1) {
                // if (String(set.packets[j].name).search(new RegExp(`\\b${i + 1}\\b`)) >= 0) {
                    correctPackets.push(set.packets[j]);
                    if (i !== j) hasSwap = true;
                    break;
                }
            }
        }

        if (hasSwap && correctPackets.length === set.packets.length) {
            console.log(set.name);
            console.log(set.packets.map(packet => packet.name));
            console.log(correctPackets.map(packet => packet.name));

            sets.updateOne({ _id: set._id }, { $set: { packets: correctPackets } });
            for (let i = 0; i < set.packets.length; i++) {
                tossups.updateMany({ packet: correctPackets[i]._id }, { $set: { packetNumber: i + 1 } });
                bonuses.updateMany({ packet: correctPackets[i]._id }, { $set: { packetNumber: i + 1 } });
            }
        }
    });
}


async function fixSpaces() {
    const fields = ['question', 'answer', 'formatted_answer', 'leadin'];
    const arrayFields = ['parts', 'answers', 'formatted_answers'];

    for (const field of fields) {
        console.log(field, await tossups.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
        console.log(field, await bonuses.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
    }

    for (const field of arrayFields) {
        console.log(field, await tossups.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
        console.log(field, await bonuses.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
    }

    let counter = 0;

    for (const field of fields) {
        console.log('updating', field);
        tossups.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            question[field] = question[field]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();

            tossups.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });

        bonuses.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            question[field] = question[field]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();

            bonuses.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });
    }

    for (const field of arrayFields) {
        console.log('updating', field);
        tossups.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            for (let i = 0; i < question[field].length; i++) {
                question[field][i] = question[field][i]
                    .replace(/\t/g, ' ')
                    .replace(/ {2,}/g, ' ')
                    .trim();
            }

            tossups.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });

        bonuses.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            for (let i = 0; i < question[field].length; i++) {
                question[field][i] = question[field][i]
                    .replace(/\t/g, ' ')
                    .replace(/ {2,}/g, ' ')
                    .trim();
            }

            bonuses.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });
    }
}


async function getAdmins() {
    return await users.find(
        { admin: true },
        { projection: { _id: 0, username: 1 }, sort: { username: 1 } }
    ).toArray();
}

async function listAlternateSubcategories(update = false) {
    tossups.find({
        subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] }
    }).forEach(question => {
        const { _id } = question;
        const text = question.question + ' ' + question.answer;
        console.log(JSON.stringify({ _id, text, type: 'tossup' }));
    });

    bonuses.find({
        subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] }
    }).forEach(question => {
        const { _id } = question;
        const text = question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');
        console.log(JSON.stringify({ _id, text, type: 'bonus' }));
    });

    if (update) {
        console.log(await tossups.updateMany(
            { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
            { $rename: { subcategory: 'alternate_subcategory' } }
        ));

        console.log(await bonuses.updateMany(
            { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
            { $rename: { subcategory: 'alternate_subcategory' } }
        ));

        console.log(await tossupData.updateMany(
            { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
            { $rename: { subcategory: 'alternate_subcategory' } }
        ));

        console.log(await bonusData.updateMany(
            { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
            { $rename: { subcategory: 'alternate_subcategory' } }
        ));
    }
}


function listQuestionsWithoutSubcategory() {
    tossups.find({ subcategory: { $exists: false } })
        .forEach(question => {
            const { _id } = question;
            const text = question.question + ' ' + question.answer;
            console.log(JSON.stringify({ _id, text, type: 'tossup' }));
        });

    bonuses.find({ subcategory: { $exists: false } })
        .forEach(question => {
            const { _id } = question;
            const text = question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');
            console.log(JSON.stringify({ _id, text, type: 'bonus' }));
        });
}


function listSetsWithAnswerFormatting() {
    tossups.aggregate([
        { $match: { formatted_answer: { $exists: true } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });

    bonuses.aggregate([
        { $match: { formatted_answers: { $exists: true } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });
}


function listSetsWithoutField(field) {
    tossups.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });

    bonuses.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });
}


async function printMostReadBonuses(limit = 1) {
    await bonusData.aggregate([
        { $match: { bonus_id: { $exists: true } } },
        { $group: { _id: '$bonus_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]).forEach(result => {
        bonuses.findOne({ _id: result._id }).then(question => {
            console.log(`Number of times read: ${result.count}`);
            console.log(bonusToString(question));
        });
    });
}


async function printMostReadTossups(limit = 1) {
    await tossupData.aggregate([
        { $match: { tossup_id: { $exists: true } } },
        { $group: { _id: '$tossup_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]).forEach(result => {
        tossups.findOne({ _id: result._id }).then(question => {
            console.log(`Number of times read: ${result.count}`);
            console.log(tossupToString(question));
        });
    });
}


async function renamePacket(setName, packetNumber, newPacketName) {
    const set = await sets.findOne({ name: setName });
    const packet = set.packets[packetNumber - 1];
    await sets.updateOne(
        { _id: set._id },
        { $set: { [`packets.${packetNumber - 1}.name`]: newPacketName } }
    );

    console.log(await tossups.updateMany(
        { packet: packet._id },
        { $set: { packetName: newPacketName, updatedAt: new Date() } }
    ));
    console.log(await bonuses.updateMany(
        { packet: packet._id },
        { $set: { packetName: newPacketName, updatedAt: new Date() } }
    ));
}


async function renameSet(oldName, newName) {
    const year = parseInt(newName.slice(0, 4));
    const set = await sets.findOneAndUpdate({ name: oldName }, { $set: { name: newName, year } }).then(result => result.value);
    console.log(set._id);

    console.log(await tossups.updateMany(
        { set: set._id },
        { $set: { setName: newName, year, updatedAt: new Date() } }
    ));

    console.log(await bonuses.updateMany(
        { set: set._id },
        { $set: { setName: newName, year, updatedAt: new Date() } }
    ));
}


async function removeTrailingBonusesString() {
    const count = await tossups.countDocuments({ answer: /bonuses/i });
    console.log(count);

    tossups.find({ answer: /bonuses/i }).forEach(tossup => {
        tossups.updateOne(
            { _id: tossup._id },
            { $set: {
                answer: tossup.answer.replace(/bonuses.*/i, ''),
                updatedAt: new Date(),
            } }
        );

        if (tossup.formatted_answer) {
            tossups.updateOne(
                { _id: tossup._id },
                { $set: { formatted_answer: tossup.formatted_answer.replace(/(<b><u>)?bonuses.*/i, '') } }
            );
        }
    });
}
async function sanitizeLeadin() {
    const regExp = /(?<=each:) {2}.*/i;
    const count = await bonuses.countDocuments({ leadin: { $regex: regExp } });
    console.log(count);

    let counter = 0;

    bonuses.find({ leadin: { $regex: regExp } }).forEach(question => {
        bonuses.updateOne(
            { _id: question._id },
            { $set: { leadin: question.leadin.replace(regExp, '').trim(), updatedAt: new Date() } }
        );

        counter++;
        if (counter % 100 === 0) {
            console.log(counter);
        }
    });

    return counter;
}


function standardizeSubcategories() {
    let counter = 0;

    tossups.find(
        { subcategory: { $nin: Object.keys(cats) } },
        { projection: { _id: 1, category: 1, subcategory: 1 } },
    ).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) return;

        if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            updateOneSubcategory(question._id, 'tossup', question.subcategory, false);
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
        }
    });

    bonuses.find(
        { subcategory: { $nin: Object.keys(cats) } },
        { projection: { _id: 1, category: 1, subcategory: 1 } },
    ).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) return;

        if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            updateOneSubcategory(question._id, 'bonus', question.subcategory, false);
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
        }
    });
}

/**
 *
 * @param {String | ObjectId} _id the id of the question to update
 * @param {'tossup' | 'bonus'} type the type of question to update
 * @param {String} subcategory the new subcategory to set
 * @param {Boolean} clearReports whether to clear the reports field
 * @returns {Promise<UpdateResult>}
 */
async function updateOneSubcategory(_id, type, subcategory, clearReports = true) {
    if (!(subcategory in cats)) {
        console.log(`Subcategory ${subcategory} not found`);
        return;
    }

    if (typeof _id === 'string') {
        _id = new ObjectId(_id);
    }

    const updateDoc = { $set: { category: cats[subcategory], subcategory: subcategory, updatedAt: new Date() } };

    if (clearReports)
        updateDoc['$unset'] = { reports: 1 };

    switch (type) {
    case 'tossup':
        tossupData.updateMany({ tossup_id: _id }, { $set: { category: cats[subcategory], subcategory: subcategory } });
        return await tossups.updateOne({ _id: _id }, updateDoc);
    case 'bonus':
        bonusData.updateMany({ bonus_id: _id }, { $set: { category: cats[subcategory], subcategory: subcategory } });
        return await bonuses.updateOne({ _id: ObjectId(_id) }, updateDoc);
    }
}


/**
 * Each line of the file at `filename` should be a valid JSON object with a `_id`, `type`, `category`, and `subcategory` field.
 * This function updates each document located at `_id` with the corresponding `category` and `subcategory`.
 * @param {String} filename the file from which to read in data for the categories
 */
async function updateManySubcategories(filename='input.txt') {
    const data = readFileSync(filename, { encoding: 'utf-8' });

    let counter = 0;

    for (const line of data.split('\n')) {
        if (line === '')
            continue;

        const { _id, subcategory, type } = JSON.parse(line);
        const result = await updateOneSubcategory(_id, type, subcategory, false);

        counter++;
        if (counter % 100 == 0) {
            console.log(counter);
            console.log(result);
        }
    }
}


async function updatePacketNumber(packet_id, packetNumber) {
    const packet = await packets.findOneAndUpdate({ _id: packet_id }, { $set: { number: packetNumber } });
    console.log(await tossups.updateMany({ packet_id: packet._id }, { $set: { packetNumber: packetNumber, packetName: packet.name } }));
    console.log(await bonuses.updateMany({ packet_id: packet._id }, { $set: { packetNumber: packetNumber, packetName: packet.name } }));
}

async function updateSetDifficulty(setName, difficulty) {
    const result = await sets.findOneAndUpdate({ name: setName }, { $set: { difficulty: difficulty } });
    const { _id } = result.value;

    await tossupData.updateMany(
        { set_id: _id },
        { $set: { difficulty: difficulty } },
    );

    await bonusData.updateMany(
        { set_id: _id },
        { $set: { difficulty: difficulty } },
    );

    console.log(await tossups.updateMany(
        { set: _id },
        { $set: { difficulty: difficulty, updatedAt: new Date() } }
    ));

    console.log(await bonuses.updateMany(
        { set: _id },
        { $set: { difficulty: difficulty, updatedAt: new Date() } },
    ));
}
