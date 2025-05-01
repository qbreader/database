import { perTossupData, tossups, perBonusData, bonuses } from '../collections.js';
import { SUBCATEGORY_TO_CATEGORY } from '../../categories.js';

/**
 *
 * @param {ObjectId} _id the id of the question to update
 * @param {'tossup' | 'bonus'} type the type of question to update
 * @param {string} subcategory the new subcategory to set
 * @param {string} [alternateSubcategory] the alternate subcategory to set
 * @param {boolean} [clearReports=true] whether to clear the reports field
 * @returns {Promise<UpdateResult>}
 */
export default async function updateSubcategory (_id, type, subcategory, alternateSubcategory, clearReports = true) {
  if (!(subcategory in SUBCATEGORY_TO_CATEGORY)) {
    console.log(`Subcategory ${subcategory} not found`);
    return;
  }

  const category = SUBCATEGORY_TO_CATEGORY[subcategory];

  const dataUpdate = {
    $set: {
      category,
      subcategory
    },
    $unset: {}
  };

  const questionUpdate = {
    $set: {
      category,
      subcategory,
      updatedAt: new Date()
    },
    $unset: {}
  };

  if (clearReports) {
    questionUpdate.$unset.reports = 1;
  }

  if (alternateSubcategory) {
    questionUpdate.$set.alternate_subcategory = alternateSubcategory;
    dataUpdate.$set.alternate_subcategory = alternateSubcategory;
  } else {
    questionUpdate.$unset.alternate_subcategory = 1;
    dataUpdate.$unset.alternate_subcategory = 1;
  }

  switch (type) {
    case 'tossup': {
      await perTossupData.updateOne({ _id }, dataUpdate);
      return await tossups.updateOne({ _id }, questionUpdate);
    }
    case 'bonus': {
      await perBonusData.updateOne({ _id }, dataUpdate);
      return await bonuses.updateOne({ _id }, questionUpdate);
    }
  }
}
