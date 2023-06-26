import 'dotenv/config';

import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
    client.close();
});

const geoword = client.db('geoword');
const buzzes = geoword.collection('buzzes');
const divisionChoices = geoword.collection('division-choices');
const packets = geoword.collection('packets');
const payments = geoword.collection('payments');
const tossups = geoword.collection('tossups');

const accountInfo = client.db('account-info');
const users = accountInfo.collection('users');

async function deleteBuzzes(packetName) {
    await buzzes.deleteMany({ packetName });
}

async function deleteAdminBuzzes(packetName) {
    const admins = await users.find({ admin: true }).toArray();

    for (const admin of admins) {
        console.log(admin.username);
        console.log(await buzzes.deleteMany({ user_id: admin._id, packetName }));
    }
}

async function deletePacket(packetName) {
    await packets.deleteOne({ name: packetName });
    await tossups.deleteMany({ packetName });
    await buzzes.deleteMany({ packetName });
}

async function manuallyAddPayment(username, packetName) {
    const user = await users.findOne({ username });
    if (!user) {
        return null;
    }

    const user_id = user._id;

    return await payments.replaceOne(
        { user_id, packetName },
        { user_id, packetName, createdAt: new Date(), manual: true },
        { upsert: true }
    );
}


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
