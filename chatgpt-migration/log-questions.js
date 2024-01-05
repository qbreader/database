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

await tossups.find({ subcategory: 'Other Science', alternate_subcategory: { $exists: false } }).forEach(tossup => {
    writeFileSync('tossups.txt', tossup._id + 'QQQQQQQQ' + tossup.question + ' ' + tossup.answer + '\n', { flag: 'a' });
});

await bonuses.find({ subcategory: 'Other Science', alternate_subcategory: { $exists: false } }).forEach(bonus => {
    writeFileSync('bonuses.txt', bonus._id + 'QQQQQQQQ' + bonusToString(bonus, false).replace(/\n/g, ' ') + '\n', { flag: 'a' });
});
