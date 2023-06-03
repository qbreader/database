import 'dotenv/config';

import { readFileSync } from 'fs';
import { MongoClient } from 'mongodb';

const packetName = '';
const difficulty = 'easy';

console.assert(['easy', 'medium', 'hard'].includes(difficulty), 'difficulty must be easy, medium, or hard');

const data = JSON.parse(readFileSync(`${packetName}.json`));

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    const database = client.db('geoword');
    const answers = database.collection('answers');

    console.log(await answers.deleteMany({ packetName, difficulty }));

    const { tossups } = data;

    for (let index = 0; index < tossups.length; index++) {
        const tossup = tossups[index];

        tossup.question = tossup.question.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
        tossup.answer = tossup.answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();

        if (tossup.formatted_answer) {
            tossup.formatted_answer = tossup.formatted_answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
        }

        tossup.difficulty = tossup.difficulty || difficulty;
        tossup.packetName = packetName;
        tossup.questionNumber = tossup.questionNumber || (index + 1);
    }

    console.log(await answers.insertMany(tossups));
});
