import 'dotenv/config';

import { client } from '../core/mongodb-client.js';

import { ObjectId } from 'mongodb';

const geoword = client.db('geoword');
const audio = geoword.collection('audio');
const buzzes = geoword.collection('buzzes');
const divisionChoices = geoword.collection('division-choices');
const packets = geoword.collection('packets');
const payments = geoword.collection('payments');
const sampleAudio = geoword.collection('sample-audio');
const tossups = geoword.collection('tossups');

const accountInfo = client.db('account-info');
const users = accountInfo.collection('users');

await client.close();

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
  const packet = await packets.findOne({ name: packetName });
  if (packet?.sample_audio_id) {
    await sampleAudio.deleteOne({ _id: packet.sample_audio_id });
  }
  for (const tossup of await tossups.find({ 'packet.name': packetName }).toArray()) {
    if (tossup.audio_id) {
      await audio.deleteOne({ _id: tossup.audio_id });
    }
  }
  await packets.deleteOne({ name: packetName });
  await tossups.deleteMany({ 'packet.name': packetName });
  await buzzes.deleteMany({ 'packet.name': packetName });
  await divisionChoices.deleteMany({ 'packet.name': packetName });
  await payments.deleteMany({ 'packet.name': packetName });
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
