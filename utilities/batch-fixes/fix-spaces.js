import { tossups, bonuses } from '../collections.js';
import removeHTML from '../../core/remove-html.js';
import sanitizeString from '../../core/sanitize-string.js';

/**
 *
 * @param {'bonus' | 'tossup'} type
 * @returns
 */
function typeToCollection (type) {
  if (type === 'tossup') {
    return tossups;
  } else if (type === 'bonus') {
    return bonuses;
  }
  throw new Error(`Unknown type: ${type}`);
}

const spaceRegex = /\t|^ | $| {2,}/g;

/**
 * Fixes extra spaces in specified fields of 'tossup' and 'bonus' documents in the database.
 *
 * @param {Object} [options={}] - Options for the function.
 * @param {boolean} [options.performUpdates=false] - If true, updates the documents in the database; otherwise, only logs the counts.
 * @returns {Promise<void>} Resolves when the operation is complete.
 */
export default async function fixSpaces ({ performUpdates = false } = {}) {
  const fields = {
    tossup: ['question', 'answer'],
    bonus: ['leadin']
  };
  const arrayFields = {
    tossup: [],
    bonus: ['parts', 'answers']
  };

  let counter = 0;

  for (const type in fields) {
    for (const field of fields[type]) {
      const count = await typeToCollection(type).countDocuments({ [field]: spaceRegex });
      console.log(field, count);
      console.log(`${count > 0 ? 'updating' : 'skipping'} ${type}.${field} and ${type}.${field}_sanitized`);
      if (count === 0) { continue; }
      if (!performUpdates) { continue; }

      for (const question of await typeToCollection(type).find({ [field]: spaceRegex }).toArray()) {
        question[field] = question[field].replace(spaceRegex, ' ').trim();

        await typeToCollection(type).updateOne(
          { _id: question._id },
          { $set: { [field]: question[field], [`${field}_sanitized`]: sanitizeString(removeHTML(question[field])) } }
        );

        counter++;
        if (counter % 100 === 0) {
          console.log(counter);
        }
      }
    }
  }

  for (const type in fields) {
    for (const field of arrayFields[type]) {
      const count = await typeToCollection(type).countDocuments({ [field]: spaceRegex });
      console.log(field, count);
      console.log(`${count > 0 ? 'updating' : 'skipping'} ${type}.${field}[] and ${type}.${field}_sanitized[]`);
      if (count === 0) { continue; }
      if (!performUpdates) { continue; }

      for (const question of await typeToCollection(type).find({ [field]: spaceRegex }).toArray()) {
        question[field] = question[field].map(part => part.replace(spaceRegex, ' ').trim());

        await typeToCollection(type).updateOne(
          { _id: question._id },
          { $set: { [field]: question[field], [`${field}_sanitized`]: question[field].map(part => sanitizeString(part)) } }
        );

        counter++;
        if (counter % 100 === 0) {
          console.log(counter);
        }
      }
    }
  }
}
