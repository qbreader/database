/**
 * Replace the set with the same name in the database with the set in the folder
 * without changing the ObjectId of any documents.
 * This also updates the packet names of all matching documents.
 * This also does not affect the setName of any document.
 * This creates new documents/questions if they do not exist in a packet,
 * but it does **not** create new packets.
 */

/**
 * Ensure folder with same name exists
 */
const SET_NAME = '';

require('dotenv').config();

const fs = require('fs');
const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    const database = client.db('qbreader');
    const sets = database.collection('sets');
    const tossups = database.collection('tossups');
    const bonuses = database.collection('bonuses');

    const tossupBulk = tossups.initializeUnorderedBulkOp();
    const bonusBulk = bonuses.initializeUnorderedBulkOp();

    const set = await sets.findOne({ name: SET_NAME });
    const setUpdateDoc = {};

    let packetNumber = 0;
    fs.readdirSync(SET_NAME).sort().forEach((fileName) => {
        if (!fileName.endsWith('.json')) {
            return;
        } else {
            packetNumber++;
        }

        if (packetNumber - 1 >= set.packets.length) {
            console.log(`Packet number ${packetNumber} is too high for packet ${fileName}`);
            return;
            // throw new Error('Packet number is too high');
        }
        const packet_id = set.packets[packetNumber - 1]._id;

        const packetName = fileName.slice(0, -5);
        setUpdateDoc[`packets.${packetNumber - 1}.name`] = packetName;

        const data = JSON.parse(fs.readFileSync(`${SET_NAME}/${fileName}`));

        if (data.tossups) {
            data.tossups.forEach((tossup, index) => {
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
                if (index < set.packets[packetNumber - 1].tossups.length) {
                    tossupBulk.find({ packet: packet_id, questionNumber: index + 1 }).updateOne(updateDoc);
                } else {
                    tossupBulk.insert({
                        packet: packet_id,
                        questionNumber: index + 1,
                        set: set._id,
                        type: 'tossup',
                        createdAt: new Date(),
                        packetNumber: packetNumber,
                        setName: SET_NAME,
                        setYear: set.year,
                        ...updateDoc.$set,
                    });
                }
            });
        } else {
            console.log('no tossups for ' + SET_NAME + '/' + fileName);
        }

        if (data.bonuses) {
            data.bonuses.forEach((bonus, index) => {
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
                        values: bonus.values,
                        difficulties: bonus.difficulties,
                        packetName: packetName,
                    },
                    $unset: {
                        reports: '',
                    }
                };
                if (index < set.packets[packetNumber - 1].bonuses.length) {
                    bonusBulk.find({ packet: packet_id, questionNumber: index + 1 }).updateOne(updateDoc);
                } else {
                    bonusBulk.insert({
                        packet: packet_id,
                        questionNumber: index + 1,
                        set: set._id,
                        type: 'bonus',
                        createdAt: new Date(),
                        packetNumber: packetNumber,
                        setName: SET_NAME,
                        setYear: set.year,
                        ...updateDoc.$set,
                    });
                }
            });
        } else {
            console.log('no bonuses for ' + SET_NAME + '/' + fileName);
        }
    });

    console.log(await sets.updateOne({ name: SET_NAME }, { $set: setUpdateDoc }));
    console.log(await tossupBulk.execute());
    console.log(await bonusBulk.execute());
});
