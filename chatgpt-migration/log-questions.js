import 'dotenv/config';

import { client } from '../core/mongodb-client.js';

import { writeFileSync } from 'fs';

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
  const tossupCursor = tossups.find(filter);
  let tossup = await tossupCursor.next();
  while (tossup !== null) {
    writeFileSync(
      tossupFilename,
      JSON.stringify({ _id: tossup._id, text: tossup.question_sanitized + ' ' + tossup.answer_sanitized }) + '\n',
      { flag: 'a' }
    );
    tossup = await tossupCursor.next();
  }
  console.log('Finished processing tossups');

  const bonusCursor = bonuses.find(filter);
  let bonus = await bonusCursor.next();
  while (bonus !== null) {
    writeFileSync(
      bonusFilename,
      JSON.stringify({ _id: bonus._id, text: bonusToString(bonus) }) + '\n',
      { flag: 'a' }
    );
    bonus = await bonusCursor.next();
  }
  console.log('Finished processing bonuses');
}

await logQuestions({ 'reports.reason': 'wrong-category' });
await client.close();
