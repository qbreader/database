import 'dotenv/config';

import { client } from './core/mongodb-client.js';
import sanitizeString from './core/sanitize-string.js';

import * as fs from 'fs';
import { ObjectId } from 'mongodb';

const database = client.db('qbreader');

const bonuses = database.collection('bonuses');
const packets = database.collection('packets');
const sets = database.collection('sets');
const tossups = database.collection('tossups');

const accountInfo = client.db('account-info');

const perTossupData = accountInfo.collection('per-tossup-data');
const perBonusData = accountInfo.collection('per-bonus-data');

/**
 * Upload a packet without deleting existing `_id` references.
 * Creates new packets _as needed_.
 * @param {object} params
 * @param {string} params.setName
 * @param {string} params.packetName
 * @param {number} params.packetNumber
 * @param {boolean} params.zeroIndexQuestions - whether question numbering starts at 0 or 1. Defaults to 1.
 * @param {string} params.folderPath - the folder that the packet is in. Defaults to the current directory.
 * @param {boolean} params.shiftPacketNumbers - whether to shift the packet numbers of existing packets. Defaults to `false`.
 */
async function upsertPacket ({ setName, packetName, packetNumber, preserveCategory, zeroIndexQuestions, folderPath = './', shiftPacketNumbers = false }) {
  const tossupBulk = tossups.initializeUnorderedBulkOp();
  const bonusBulk = bonuses.initializeUnorderedBulkOp();
  const perTossupDataBulk = perTossupData.initializeUnorderedBulkOp();
  const perBonusDataBulk = perBonusData.initializeUnorderedBulkOp();

  const data = JSON.parse(fs.readFileSync(`${folderPath}/${packetName}.json`));
  let packetAlreadyExists = false;

  const set = await sets.findOne({ name: setName });
  const packet = await packets.findOne({ 'set._id': set._id, number: packetNumber });

  if (shiftPacketNumbers) {
    await packets.dropIndex('set.name_1_number_1');
    console.log(await tossups.updateMany({ 'set._id': set._id, 'packet.number': { $gte: packetNumber } }, { $inc: { 'packet.number': 1 } }));
    console.log(await bonuses.updateMany({ 'set._id': set._id, 'packet.number': { $gte: packetNumber } }, { $inc: { 'packet.number': 1 } }));
    console.log(await packets.updateMany({ 'set._id': set._id, number: { $gte: packetNumber } }, { $inc: { number: 1 } }));
  } else if (packet) {
    packetAlreadyExists = true;
  }

  const packetId = packetAlreadyExists ? packet._id : new ObjectId();

  if (packetAlreadyExists) {
    await packets.updateOne({ _id: packetId }, { $set: { name: packetName } });
    await tossups.updateMany({ 'packet._id': packetId }, { $set: { 'packet.name': packetName } });
    await bonuses.updateMany({ 'packet._id': packetId }, { $set: { 'packet.name': packetName } });
  } else {
    await packets.insertOne({ _id: packetId, name: packetName, number: packetNumber, set: { _id: set._id, name: setName } });
  }

  const tossupCount = await tossups.countDocuments({ 'packet._id': packetId });
  if (tossupCount > data.tossups.length) {
    console.log(`Warning: ${tossupCount} tossups already in database, only uploading ${data.tossups.length}.`);
  }

  data.tossups.forEach(async (tossup, index) => {
    const number = zeroIndexQuestions ? index : index + 1;

    tossup.question = tossup.question.replace(/ {2,}/g, ' ');
    tossup.question_sanitized = sanitizeString(tossup.question_sanitized.replace(/ {2,}/g, ' '));
    tossup.answer = tossup.answer.replace(/ {2,}/g, ' ');
    tossup.answer_sanitized = sanitizeString(tossup.answer_sanitized.replace(/ {2,}/g, ' '));

    const updateDoc = {
      $set: {
        question: tossup.question,
        question_sanitized: tossup.question_sanitized,
        answer: tossup.answer,
        answer_sanitized: tossup.answer_sanitized,
        updatedAt: new Date(),
        category: tossup.category,
        subcategory: tossup.subcategory
      },
      $unset: {
        reports: ''
      }
    };

    if (tossup.alternate_subcategory) {
      updateDoc.$set.alternate_subcategory = tossup.alternate_subcategory;
    } else {
      updateDoc.$unset.alternate_subcategory = '';
    }

    if (index < tossupCount && packetAlreadyExists) {
      if (preserveCategory) {
        delete updateDoc.$set.category;
        delete updateDoc.$set.subcategory;
        delete updateDoc.$set.alternate_subcategory;
        delete updateDoc.$unset.alternate_subcategory;
      }
      updateDoc.$set['packet.name'] = packetName;
      const statsUpdateDoc = { $set: { difficulty: set.difficulty } };
      if (!preserveCategory) {
        statsUpdateDoc.$set.category = tossup.category;
        statsUpdateDoc.$set.subcategory = tossup.subcategory;
        if (tossup.alternate_subcategory) {
          statsUpdateDoc.$set.alternate_subcategory = tossup.alternate_subcategory;
        } else {
          statsUpdateDoc.$unset = { alternate_subcategory: tossup.alternate_subcategory };
        }
      }
      const { _id } = await tossups.findOneAndUpdate({ 'packet._id': packetId, number }, updateDoc);
      await perTossupData.updateOne({ _id }, statsUpdateDoc);
    } else {
      const tossupId = new ObjectId();
      tossupBulk.insert({
        ...updateDoc.$set,
        _id: tossupId,
        number,
        difficulty: set.difficulty,
        packet: {
          _id: packetId,
          name: packetName,
          number: packetNumber
        },
        set: {
          _id: set._id,
          name: setName,
          year: set.year,
          standard: set.standard
        }
      });
      perTossupDataBulk.insert({
        _id: tossupId,
        category: tossup.category,
        data: [],
        difficulty: set.difficulty,
        set_id: set._id,
        subcategory: tossup.subcategory,
        ...(tossup.alternate_subcategory && { alternate_subcategory: tossup.alternate_subcategory })
      });
    }
  });

  const bonusCount = await bonuses.countDocuments({ 'packet._id': packetId });
  if (bonusCount > data.bonuses.length) {
    console.log(`Warning: ${bonusCount} bonuses already in database, only uploading ${data.bonuses.length}.`);
  }

  data.bonuses.forEach(async (bonus, index) => {
    const number = zeroIndexQuestions ? index : index + 1;

    bonus.leadin = bonus.leadin.replace(/ {2,}/g, ' ');
    bonus.leadin_sanitized = sanitizeString(bonus.leadin_sanitized.replace(/ {2,}/g, ' '));

    for (let i = 0; i < bonus.parts.length; i++) {
      bonus.parts[i] = bonus.parts[i].replace(/ {2,}/g, ' ');
      bonus.parts_sanitized[i] = sanitizeString(bonus.parts_sanitized[i].replace(/ {2,}/g, ' '));
    }

    for (let i = 0; i < bonus.answers.length; i++) {
      bonus.answers[i] = bonus.answers[i].replace(/ {2,}/g, ' ');
      bonus.answers_sanitized[i] = sanitizeString(bonus.answers_sanitized[i].replace(/ {2,}/g, ' '));
    }

    const updateDoc = {
      $set: {
        leadin: bonus.leadin,
        leadin_sanitized: bonus.leadin_sanitized,
        parts: bonus.parts,
        parts_sanitized: bonus.parts_sanitized,
        answers: bonus.answers,
        answers_sanitized: bonus.answers_sanitized,
        updatedAt: new Date(),
        category: bonus.category,
        subcategory: bonus.subcategory
      },
      $unset: {
        reports: ''
      }
    };

    if (bonus.alternate_subcategory) {
      updateDoc.$set.alternate_subcategory = bonus.alternate_subcategory;
    } else {
      updateDoc.$unset.alternate_subcategory = '';
    }

    if (bonus.values) {
      updateDoc.$set.values = bonus.values;
    }

    if (bonus.difficultyModifiers) {
      updateDoc.$set.difficultyModifiers = bonus.difficultyModifiers;
    }

    if (index < bonusCount && packetAlreadyExists) {
      if (preserveCategory) {
        delete updateDoc.$set.category;
        delete updateDoc.$set.subcategory;
        delete updateDoc.$set.alternate_subcategory;
        delete updateDoc.$unset.alternate_subcategory;
      }
      updateDoc.$set['packet.name'] = packetName;
      const statsUpdateDoc = { $set: { difficulty: set.difficulty } };
      if (!preserveCategory) {
        statsUpdateDoc.$set.category = bonus.category;
        statsUpdateDoc.$set.subcategory = bonus.subcategory;
        if (bonus.alternate_subcategory) {
          statsUpdateDoc.$set.alternate_subcategory = bonus.alternate_subcategory;
        } else {
          statsUpdateDoc.$unset = { alternate_subcategory: bonus.alternate_subcategory };
        }
      }
      const { _id } = await bonuses.findOneAndUpdate({ 'packet._id': packetId, number }, updateDoc);
      await perBonusData.updateOne({ _id }, statsUpdateDoc);
    } else {
      const bonusId = new ObjectId();
      bonusBulk.insert({
        ...updateDoc.$set,
        _id: bonusId,
        number,
        difficulty: set.difficulty,
        packet: {
          _id: packetId,
          name: packetName,
          number: packetNumber
        },
        set: {
          _id: set._id,
          name: setName,
          year: set.year,
          standard: set.standard
        }
      });
      perBonusDataBulk.insert({
        _id: bonusId,
        category: bonus.category,
        data: [],
        difficulty: set.difficulty,
        set_id: set._id,
        subcategory: bonus.subcategory,
        ...(bonus.alternate_subcategory && { alternate_subcategory: bonus.alternate_subcategory })
      });
    }
  });

  if (tossupBulk.length > 0) {
    console.log(`tossupBulk: ${tossupBulk.length}`);
    await tossupBulk.execute();
  }

  if (bonusBulk.length > 0) {
    console.log(`bonusBulk: ${bonusBulk.length}`);
    await bonusBulk.execute();
  }

  if (perTossupDataBulk.length > 0) {
    await perTossupDataBulk.execute();
  }

  if (perBonusDataBulk.length > 0) {
    await perBonusDataBulk.execute();
  }

  if (shiftPacketNumbers) {
    await packets.createIndex({ 'set.name': 1, number: 1 }, { unique: true });
  }

  console.log(`Uploaded ${setName} Packet ${packetName}`);
}

/**
 *
 * @param {string} setName
 * @param {number} difficulty - the difficulty of the set, as a number from 0 to 10. This parameter is ignored if the set already exists.
 * @param {object} params
 * @param {boolean} [params.preserveCategory=false] - whether to preserve the category of existing questions of tossups and bonuses. Defaults to `false`.
 * @param {boolean} [params.standard] - whether the set is a standard set. Defaults to true. This parameter is ignored if the set already exists.
 * @param {boolean} [params.zeroIndexQuestions=false] - whether question numbering starts at 0 or 1. Defaults to 1 (i.e. zeroIndexQuestions = false).
 * @param {string} [params.folderPath='./'] - the folder that the set is in. Defaults to the current directory.
 * @returns {Promise<boolean>} whether the set existed before updating
 */
async function upsertSet (setName, difficulty, { preserveCategory = false, standard = true, zeroIndexQuestions = false, folderPath = './' } = {}) {
  let setAlreadyExists = await sets.countDocuments({ name: setName });
  setAlreadyExists = !!setAlreadyExists;

  if (!setAlreadyExists && (!difficulty || typeof difficulty !== 'number')) {
    throw new Error(`Set ${setName} does not exist and difficulty ${difficulty} is invalid`);
  }

  if (!setAlreadyExists) {
    console.log(`Set ${setName} does not exist`);
    setAlreadyExists = false;
    await sets.insertOne({ _id: new ObjectId(), name: setName, year: parseInt(setName.slice(0, 4)), difficulty, standard });
  }

  let packetNumber = 0;

  for (const fileName of fs.readdirSync(`${folderPath}/${setName}`).sort()) {
    if (!fileName.endsWith('.json')) {
      return;
    }

    const packetName = fileName.slice(0, -5);
    packetNumber++;

    await upsertPacket({ setName, packetName, packetNumber, preserveCategory, zeroIndexQuestions, folderPath: `${folderPath}/${setName}` });
  }

  return setAlreadyExists;
}

export { upsertPacket, upsertSet };

// await upsertPacket({ setName: '', packetName: '', packetNumber: 1, shiftPacketNumbers: true });
// console.log(await upsertSet(''));

await client.close();
