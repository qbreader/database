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

function bonusToString (bonus) {
  let string = '';
  string += `${bonus.leadin} `;
  for (let i = 0; i < bonus.answers.length; i++) {
    string += `[10] ${bonus.parts[i]} `;
    string += `ANSWER: ${bonus.answers[i]} `;
  }

  return string;
}

/**
 * Logs questions to the specified files.
 * @param {Object} filter - The filter object to specify the criteria for selecting questions.
 * @param {string} [tossupFilename='tossup-log.txt'] - The filename for the tossup log file.
 * @param {string} [bonusFilename='bonus-log.txt'] - The filename for the bonus log file.
 * @returns {Promise<void>} A promise that resolves when the logging is complete.
 */
async function logQuestions (filter, tossupFilename = 'tossup-log.txt', bonusFilename = 'bonus-log.txt') {
  await tossups.find(filter).forEach(tossup => {
    writeFileSync(
      tossupFilename,
      JSON.stringify({ _id: tossup._id, text: tossup.question_sanitized + ' ' + tossup.answer_sanitized }) + '\n',
      { flag: 'a' }
    );
  });

  await bonuses.find(filter).forEach(bonus => {
    writeFileSync(
      bonusFilename,
      JSON.stringify({ _id: bonus._id, text: bonusToString(bonus) }) + '\n',
      { flag: 'a' }
    );
  });
}

// await logQuestions({ 'reports.reason': 'wrong-category' });
