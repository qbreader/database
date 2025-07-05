import { bonuses, tossups } from '../collections.js';

/**
 * Replaces all <em> and </em> tags with <i> and </i> tags in the 'answer' fields of tossups
 * and the 'answers' arrays of bonuses in the database. Optionally performs updates or just logs changes.
 *
 * @param {Object} [options={}] - Options for the function.
 * @param {boolean} [options.performUpdates=false] - If true, updates the database; otherwise, only logs changes.
 * @returns {Promise<void>} Resolves when processing is complete.
 */
export default async function fixEmTags ({ performUpdates = false } = {}) {
  const findRegex = /<em>/g;

  console.log('tossup', await tossups.countDocuments({ answer: findRegex }));
  for (const tossup of await tossups.find({ answer: findRegex }).toArray()) {
    const answer = tossup.answer.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>');
    if (!performUpdates) {
      console.log(`${tossup._id}: ${tossup.answer}`);
      console.log(`                      ->: ${answer}`);
      break;
    }
    await tossups.updateOne(
      { _id: tossup._id },
      { $set: { answer } }
    );
  }

  console.log('bonus', await bonuses.countDocuments({ answers: findRegex }));
  for (const bonus of await bonuses.find({ answers: findRegex }).toArray()) {
    const answers = bonus.answers.map(answer => answer.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>'));
    if (!performUpdates) {
      console.log(`${bonus._id}: ${bonus.answers}`);
      console.log(`                      ->: ${answers}`);
      break;
    }
    await bonuses.updateOne(
      { _id: bonus._id },
      { $set: { answers } }
    );
  }
}
