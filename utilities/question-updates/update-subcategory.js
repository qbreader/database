import { tossupData, tossups, bonusData, bonuses } from '../collections.js';

import { createRequire } from 'module';
import { ObjectId } from 'mongodb';

const require = createRequire(import.meta.url);
const cats = require('../../subcat-to-cat.json');

/**
 *
 * @param {ObjectId} _id the id of the question to update
 * @param {'tossup' | 'bonus'} type the type of question to update
 * @param {string} subcategory the new subcategory to set
 * @param {string} [alternate_subcategory] the alternate subcategory to set
 * @param {boolean} [clearReports=true] whether to clear the reports field
 * @returns {Promise<UpdateResult>}
 */
export default async function updateSubcategory(_id, type, subcategory, alternate_subcategory, clearReports = true) {
    if (!(subcategory in cats)) {
        console.log(`Subcategory ${subcategory} not found`);
        return;
    }

    const category = cats[subcategory];

    const dataUpdate = {
        $set: {
            category,
            subcategory,
        },
        $unset: {},
    };

    const questionUpdate = {
        $set: {
            category,
            subcategory,
            updatedAt: new Date(),
        },
        $unset: {},
    };

    if (clearReports) {
        questionUpdate.$unset.reports = 1;
    }

    if (alternate_subcategory) {
        questionUpdate.$set.alternate_subcategory = alternate_subcategory;
        dataUpdate.$set.alternate_subcategory = alternate_subcategory;
    } else {
        questionUpdate.$unset.alternate_subcategory = 1;
        dataUpdate.$unset.alternate_subcategory = 1;
    }

    switch (type) {
    case 'tossup': {
        tossupData.updateMany({ tossup_id: _id }, dataUpdate);
        return await tossups.updateOne({ _id }, questionUpdate);
    }
    case 'bonus': {
        bonusData.updateMany({ bonus_id: _id }, dataUpdate);
        return await bonuses.updateOne({ _id }, questionUpdate);
    }
    }
}
