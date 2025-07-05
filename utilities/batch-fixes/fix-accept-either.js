import { bonuses, tossups } from '../collections.js';
import sanitizeString from '../../core/sanitize-string.js';

/**
 *
 * @param {string} string
 * @returns
 */
function removeHTML (string) {
  return string
    .replace(/<\/?(b|u|i|em)>/g, '');
}

const acceptEitherRegex = /[a-z][A-Z].*[[(]accept either/;

/**
 * @param {string} answer
 */
function fixSingleAcceptEither (answer) {
  if (answer.match(/<\/u><\/b><b><u>/)) {
    answer = answer.replace(/<\/u><\/b><b><u>/g, '</u></b> <b><u>');
  } else if (answer.match(/<b>.*<\/u><u>.*<\/b>/)) {
    answer = answer.replace(/<\/u><u>/g, '</u></b> <b><u>');
  } else if (answer.match(/<\/u><u>/)) {
    answer = answer.replace(/<\/u><u>/g, '</u> <u>');
  }

  const answerSanitized = sanitizeString(removeHTML(answer));
  return { answer, answerSanitized };
}

async function fixAcceptEitherTossups ({ performUpdates, printFrequency }) {
  const total = await tossups.countDocuments({ answer_sanitized: { $regex: acceptEitherRegex } });
  const step = Math.floor(total / printFrequency);
  let counter = 0;

  for (const tossup of await tossups.find({ answer_sanitized: { $regex: acceptEitherRegex } }).toArray()) {
    if (++counter % step === 0) {
      console.log(`${counter} / ${total}`);
    }

    const { answer, answerSanitized } = fixSingleAcceptEither(tossup.answer);

    if (performUpdates) {
      await tossups.updateOne(
        { _id: tossup._id },
        { $set: { answer, answer_sanitized: answerSanitized } }
      );
    } else {
      console.log(`${tossup._id}: ${tossup.answer}`);
      console.log(`                      ->: ${answer}`);
      console.log(`                        : ${tossup.answer_sanitized}`);
      console.log(`                      ->: ${answerSanitized}`);
      return;
    }
  }
}

async function fixAcceptEitherBonuses ({ performUpdates, printFrequency }) {
  const total = await bonuses.countDocuments({ answers_sanitized: { $regex: acceptEitherRegex } });
  const step = Math.floor(total / printFrequency);
  let counter = 0;

  for (const bonus of await bonuses.find({ answers_sanitized: { $regex: acceptEitherRegex } }).toArray()) {
    if (++counter % step === 0) {
      console.log(`${counter} / ${total}`);
    }

    for (let i = 0; i < bonus.answers.length; i++) {
      if (!bonus.answers_sanitized[i].match(acceptEitherRegex)) {
        continue;
      }

      const { answer, answerSanitized } = fixSingleAcceptEither(bonus.answers[i]);

      if (performUpdates) {
        await bonuses.updateOne(
          { _id: bonus._id },
          { $set: { [`answers.${i}`]: answer, [`answers_sanitized.${i}`]: answerSanitized } }
        );
      } else {
        console.log(`${bonus._id}: ${bonus.answers[i]}`);
        console.log(`                      ->: ${answer}`);
        console.log(`                        : ${bonus.answers_sanitized[i]}`);
        console.log(`                      ->: ${answerSanitized}`);
        return;
      }
    }
  }
}

/**
 * Runs batch fixes to answerlines with "accept either" logic that do not have a space between the two acceptable answers.
 * Example: <b><u>Lebron</u><u>James</u></b> should be <b><u>Lebron</u></b> <b><u>James</u></b>.
 *
 * @param {object} [options] - Options for the batch fix.
 * @param {boolean} [options.performUpdates=false] - Whether to perform updates or just print what would be updated.
 * @param {number} [options.printFrequency=10] - Frequency of progress printing.
 * @returns {Promise<void>} Resolves when all fixes are complete.
 */
export default async function fixAcceptEither ({ performUpdates = false, printFrequency = 10 } = {}) {
  await fixAcceptEitherTossups({ performUpdates, printFrequency });
  await fixAcceptEitherBonuses({ performUpdates, printFrequency });
}
