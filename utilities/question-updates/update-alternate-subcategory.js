import { tossupData, tossups, bonusData, bonuses } from '../collections.js';

import { createRequire } from 'module';
import { ObjectId } from 'mongodb';

const require = createRequire(import.meta.url);
const cats = require('../../subcat-to-cat.json');

/**
 *
 * @param {string | ObjectId} _id the id of the question to update
 * @param {'tossup' | 'bonus'} type the type of question to update
 * @param {string} alternate_subcategory the new alternate_subcategory to set
 * @param {Boolean} clearReports whether to clear the reports field
 * @returns {Promise<UpdateResult>}
 */

export default async function updateAlternateSubcategory (_id, type, alternate_subcategory, clearReports = true) {
  if (typeof _id === 'string') {
    _id = new ObjectId(_id);
  }

  const updateDoc = {
    $set: { alternate_subcategory, updatedAt: new Date() },
    $unset: {}
  };

  if (clearReports) {
    updateDoc.$unset.reports = 1;
  }

  switch (type) {
    case 'tossup':
      return await tossups.updateOne({ _id }, updateDoc);
    case 'bonus':
      return await bonuses.updateOne({ _id: ObjectId(_id) }, updateDoc);
  }
}
