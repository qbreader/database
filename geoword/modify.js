import 'dotenv/config';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const database = client.db('geoword');
const answers = database.collection('answers');
const buzzes = database.collection('buzzes');

async function updateScoring(minimumCorrectPoints = 10, maximumCorrectPoints = 20) {
    const bulk = buzzes.initializeUnorderedBulkOp();

    const cursor = buzzes.find({ points: { $gt: 0 } });

    let buzz;

    while ((buzz = await cursor.next())) {
        const { celerity }  = buzz;
        const points = minimumCorrectPoints + Math.round((maximumCorrectPoints - minimumCorrectPoints) * celerity);
        bulk.find({ _id: buzz._id }).update({ $set: { points: points } });
    }

    console.log(await bulk.execute());
}
