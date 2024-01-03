import { readFileSync } from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const questionDatabase = client.db('qbreader');
const tossups = questionDatabase.collection('tossups');
const bonuses = questionDatabase.collection('bonuses');

const lines = readFileSync('output-tossups.txt', 'utf-8').split('\n');
// const lines = readFileSync('output-bonuses.txt', 'utf-8').split('\n');

let counter = 0;

for (const line of lines) {
    const question = JSON.parse(line);
    question.alternate_subcategory = question.alternate_subcategory.split('\n')[0];
    if (!['Math', 'Astronomy', 'Computer Science', 'Earth Science', 'Engineering', 'Other'].includes(question.alternate_subcategory)) {
        console.log(question);
        continue;
    }

    if (question.alternate_subcategory === 'Other') {
        continue;
    }

    await tossups.updateOne(
        { _id: new ObjectId(question.id) },
        { $set: { alternate_subcategory: question.alternate_subcategory } }
    );

    // await bonuses.updateOne(
    //     { _id: new ObjectId(question.id) },
    //     { $set: { alternate_subcategory: question.alternate_subcategory } }
    // );

    counter++;
    if (counter % 100 === 0) {
        console.log(counter);
    }
}
