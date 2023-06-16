import 'dotenv/config';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
    // console.log(await tossups.updateMany({ division: 'Division 1.json' }, { $set: { division: 'Division 1' } }));
    // buzzes.updateMany({}, { $set: { division: 'High School' } });
    // await buzzes.aggregate([
    //     { $group: {
    //         _id: '$user_id',
    //     } },
    // ]).forEach(user => {
    //     divisionChoices.insertOne({
    //         user_id: user._id,
    //         division: 'High School',
    //         packetName: 'beterword-sample',
    //     });
    // });
    client.close();
});

const geoword = client.db('geoword');
const buzzes = geoword.collection('buzzes');
const divisionChoices = geoword.collection('division-choices');
const packets = geoword.collection('packets');
const tossups = geoword.collection('tossups');

async function renamePacket(oldName, newName) {
    await buzzes.updateMany({ packetName: oldName }, { $set: { packetName: newName } });
    await divisionChoices.updateMany({ packetName: oldName }, { $set: { packetName: newName } });
    await packets.updateOne({ name: oldName }, { $set: { name: newName } });
    await tossups.updateMany({ packetName: oldName }, { $set: { packetName: newName } });
}

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
