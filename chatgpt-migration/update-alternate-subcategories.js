import 'dotenv/config';

import { readFileSync } from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const questionDatabase = client.db('qbreader');
const tossups = questionDatabase.collection('tossups');
const bonuses = questionDatabase.collection('bonuses');

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

// const lines = readFileSync('output-tossups-ofa.txt', 'utf-8').split('\n');
const lines = readFileSync('output-bonuses-ofa.txt', 'utf-8').split('\n');

const categories = [
    'Architecture',
    'Photography',
    'Film',
    'Jazz',
    'Opera',
    'Dance',
    'Misc Arts',
];

let counter = 0;

for (const line of lines) {
    const question = JSON.parse(line);
    question.alternate_subcategory = question.alternate_subcategory.split('\n')[0];
    question.alternate_subcategory = question.alternate_subcategory.trim().replace(/[.'"]/g, '');
    question.alternate_subcategory = toTitleCase(question.alternate_subcategory);

    if (!categories.includes(question.alternate_subcategory)) {
        console.log(question);
        continue;
    }

    // await tossups.updateOne(
    //     { _id: new ObjectId(question._id) },
    //     { $set: { alternate_subcategory: question.alternate_subcategory } }
    // );

    await bonuses.updateOne(
        { _id: new ObjectId(question._id) },
        { $set: { alternate_subcategory: question.alternate_subcategory } }
    );

    counter++;
    if (counter % 100 === 0) {
        console.log(counter);
    }
}
