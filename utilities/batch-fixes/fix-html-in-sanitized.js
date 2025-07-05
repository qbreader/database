import { bonuses, tossups } from '../collections.js';
import removeHTML from '../../core/remove-html.js';
import sanitizeString from '../../core/sanitize-string.js';

/**
 * Removes HTML tags from the `answer_sanitized` field of tossups and the
 * `answers_sanitized` field of bonuses in the database. Optionally updates
 * the database with the corrected values or logs the changes for review.
 *
 * @param {Object} options - The options object.
 * @param {boolean} options.performUpdates - If true, updates the database; if false, only logs changes.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
export default async function fixHTMLInSanitized ({ performUpdates }) {
  const findRegex = /<\/?([bui]|em)>/g;

  console.log('tossup', await tossups.countDocuments({ answer_sanitized: findRegex }));
  for (const tossup of await tossups.find({ answer_sanitized: findRegex }).toArray()) {
    const answerSanitized = sanitizeString(removeHTML(tossup.answer));
    if (!performUpdates) {
      console.log(`${tossup._id}: ${tossup.answer_sanitized}`);
      console.log(`                      ->: ${answerSanitized}`);
      break;
    }
    await tossups.updateOne(
      { _id: tossup._id },
      { $set: { answer_sanitized: answerSanitized } }
    );
  }

  console.log('bonus', await bonuses.countDocuments({ answers_sanitized: findRegex }));
  for (const bonus of await bonuses.find({ answers_sanitized: findRegex }).toArray()) {
    const answersSanitized = bonus.answers.map(answer => sanitizeString(removeHTML(answer)));
    if (!performUpdates) {
      console.log(`${bonus._id}: ${bonus.answers_sanitized}`);
      console.log(`                      ->: ${answersSanitized}`);
      break;
    }
    await bonuses.updateOne(
      { _id: bonus._id },
      { $set: { answers_sanitized: answersSanitized } }
    );
  }
}
