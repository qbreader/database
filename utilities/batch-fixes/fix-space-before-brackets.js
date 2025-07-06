import { bonuses, tossups } from '../collections.js';
import removeHTML from '../../core/remove-html.js';
import sanitizeString from '../../core/sanitize-string.js';

const findRegex = /[A-Za-z0-9>\])][[(]/g;
const replaceRegex = /(?<=[A-Za-z0-9>\])])(?=[[(])/g;

export default async function fixSpaceBeforeBrackets ({ performUpdates = false } = {}) {
  console.log('tossup', await tossups.countDocuments({ answer: findRegex, answer_sanitized: findRegex }));
  for (const tossup of await tossups.find({ answer: findRegex, answer_sanitized: findRegex }).toArray()) {
    const answer = tossup.answer.replace(replaceRegex, ' ');
    const answerSanitized = sanitizeString(removeHTML(answer));
    if (!performUpdates) {
      console.log(`${tossup._id}: ${tossup.answer}`);
      console.log(`                      ->: ${answer}`);
      console.log(`                        : ${tossup.answer_sanitized}`);
      console.log(`                      ->: ${answerSanitized}`);
      break;
    }
    await tossups.updateOne(
      { _id: tossup._id },
      { $set: { answer, answer_sanitized: answerSanitized } }
    );
  }

  console.log('bonus', await bonuses.countDocuments({ answers: findRegex, answers_sanitized: findRegex }));
  for (const bonus of await bonuses.find({ answers: findRegex, answers_sanitized: findRegex }).toArray()) {
    const answers = bonus.answers.map(answer => answer.replace(replaceRegex, ' '));
    const answersSanitized = answers.map(answer => sanitizeString(removeHTML(answer)));
    if (!performUpdates) {
      console.log(`${bonus._id}: ${bonus.answers}`);
      console.log(`                      ->: ${answers}`);
      console.log(`                        : ${bonus.answers_sanitized}`);
      console.log(`                      ->: ${answersSanitized}`);
      break;
    }
    await bonuses.updateOne(
      { _id: bonus._id },
      { $set: { answers, answers_sanitized: answersSanitized } }
    );
  }
}
