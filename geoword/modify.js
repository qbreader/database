import 'dotenv/config';

import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
  console.log('connected to mongodb');
  client.close();
});

const geoword = client.db('geoword');
const audio = geoword.collection('audio');
const buzzes = geoword.collection('buzzes');
const divisionChoices = geoword.collection('division-choices');
const packets = geoword.collection('packets');
const payments = geoword.collection('payments');
const tossups = geoword.collection('tossups');

const accountInfo = client.db('account-info');
const users = accountInfo.collection('users');

async function copyAudioIds () {
  let counter = 0;
  const cursor = audio.find({});
  let audioDoc;
  while ((audioDoc = await cursor.next())) {
    const { tossup_id } = audioDoc;
    await tossups.updateOne({ _id: tossup_id }, { $set: { audio_id: audioDoc._id } });
    counter++;
  }
  console.log(counter);
}

async function deactivateBuzzes (username, packetName) {
  const user = await users.findOne({ username });
  console.log(await buzzes.updateMany({ user_id: user._id, 'packet.name': packetName }, { $set: { active: false } }));
}

async function deleteBuzzes (packetName) {
  await buzzes.deleteMany({ packetName });
}

async function deleteAdminBuzzes (packetName) {
  const admins = await users.find({ admin: true }).toArray();

  for (const admin of admins) {
    console.log(admin.username);
    console.log(await buzzes.deleteMany({ user_id: admin._id, 'packet.name': packetName }));
  }
}

async function deletePacket (packetName) {
  await packets.deleteOne({ name: packetName });
  await tossups.deleteMany({ 'packet.name': packetName });
  await buzzes.deleteMany({ 'packet.name': packetName });
}

async function findMissingAudio () {
  return await tossups.aggregate([
    {
      $lookup: {
        from: 'audio',
        localField: '_id',
        foreignField: 'tossup_id',
        as: 'audio'
      }
    },
    { $match: { audio: { $size: 0 } } }
  ]).toArray();
}

async function getPaymentCount (packetName) {
  return await payments.countDocuments({ 'packet.name': packetName });
}

async function manuallyAddPayment (username, packetName) {
  const user = await users.findOne({ username });
  const packet = await packets.findOne({ name: packetName });

  if (!user || !packet) {
    return false;
  }

  console.log(await payments.replaceOne(
    { user_id: user._id, 'packet._id': packet._id },
    {
      user_id: user._id,
      packet: {
        _id: packet._id,
        name: packet.name
      },
      createdAt: new Date(),
      manual: true
    },
    { upsert: true }
  ));

  return true;
}

async function renamePacket (oldName, newName) {
  await buzzes.updateMany({ 'packet.name': oldName }, { $set: { 'packet.name': newName } });
  await divisionChoices.updateMany({ 'packet.name': oldName }, { $set: { 'packet.name': newName } });
  await packets.updateOne({ name: oldName }, { $set: { name: newName } });
  await tossups.updateMany({ 'packet.name': oldName }, { $set: { 'packet.name': newName } });
}

async function updateScoring (minimumCorrectPoints = 10, maximumCorrectPoints = 20) {
  const bulk = buzzes.initializeUnorderedBulkOp();

  const cursor = buzzes.find({ points: { $gt: 0 } });

  let buzz;

  while ((buzz = await cursor.next())) {
    const { celerity } = buzz;
    const points = minimumCorrectPoints + Math.round((maximumCorrectPoints - minimumCorrectPoints) * celerity);
    bulk.find({ _id: buzz._id }).update({ $set: { points } });
  }

  console.log(await bulk.execute());
}
