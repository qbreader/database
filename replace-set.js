/**
 * Replace the set with the same name in the database with the set in the folder
 * without changing the ObjectId of any documents.
 * This also does not affect the setName or packetName of any document,
 * and does **not** create new documents if they do not exist (e.g. if a packet is missing).
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

    let packetNumber = 0;
    fs.readdirSync(SET_NAME).sort().forEach((packetName) => {
        if (!packetName.endsWith('.json'))
            return;

        packetNumber++;
        if (packetNumber - 1 >= set.packets.length) {
            throw new Error('Packet number is too high');
        }
        const packet_id = set.packets[packetNumber - 1]._id;

        const data = JSON.parse(fs.readFileSync(`${SET_NAME}/${packetName}`));

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
                    }
                };
                tossupBulk.find({ packet: packet_id, questionNumber: index + 1 }).updateOne(updateDoc);
            });
        } else {
            console.log('no tossups for ' + SET_NAME + '/' + packetName);
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
                    }
                };
                bonusBulk.find({ packet: packet_id, questionNumber: index + 1 }).updateOne(updateDoc);
            });
        } else {
            console.log('no bonuses for ' + SET_NAME + '/' + packetName);
        }
    });

    console.log(await tossupBulk.execute());
    console.log(await bonusBulk.execute());
});
