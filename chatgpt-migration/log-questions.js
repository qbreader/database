import 'dotenv/config';

import { writeFileSync } from 'fs';
import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const questionDatabase = client.db('qbreader');
const tossups = questionDatabase.collection('tossups');
const bonuses = questionDatabase.collection('bonuses');

function bonusToString(bonus) {
    let string = '';
    string += `${bonus.leadin} `;
    for (let i = 0; i < bonus.answers.length; i++) {
        string += `[10] ${bonus.parts[i]} `;
        string += `ANSWER: ${bonus.answers[i]} `;
    }

    return string;
}

const subcategory = 'Social Science';

await tossups.find({ subcategory: subcategory, alternate_subcategory: { $exists: false } }).forEach(tossup => {
    writeFileSync(
        'tossups-ss.txt',
        JSON.stringify({ _id: tossup._id, text: tossup.question + ' ' + tossup.answer }) + '\n',
        { flag: 'a' },
    );
});

await bonuses.find({ subcategory: subcategory, alternate_subcategory: { $exists: false } }).forEach(bonus => {
    writeFileSync(
        'bonuses-ss.txt',
        JSON.stringify({ _id: bonus._id, text: bonusToString(bonus) }) + '\n',
        { flag: 'a' },
    );
});
