import { tossupData, tossups, bonusData, bonuses } from '../collections.js';

import { createRequire } from 'module';
import { ObjectId } from 'mongodb';

const require = createRequire(import.meta.url);
const cats = require('../../subcat-to-cat.json');

/**
 *
 * @param {string | ObjectId} _id the id of the question to update
 * @param {'tossup' | 'bonus'} type the type of question to update
 * @param {string} subcategory the new subcategory to set
 * @param {Boolean} clearReports whether to clear the reports field
 * @returns {Promise<UpdateResult>}
 */

export default async function updateOneSubcategory(_id, type, subcategory, clearReports = true) {
    if (!(subcategory in cats)) {
        console.log(`Subcategory ${subcategory} not found`);
        return;
    }

    if (typeof _id === 'string') {
        _id = new ObjectId(_id);
    }

    const category = cats[subcategory];

    const updateDoc = {
        $set: { category: category, subcategory: subcategory, updatedAt: new Date() },
        $unset: {},
    };

    if (clearReports) {
        updateDoc['$unset']['reports'] = 1;
    }

    switch (type) {
    case 'tossup':
        tossupData.updateMany({ tossup_id: _id }, { $set: { category: category, subcategory: subcategory } });
        return await tossups.updateOne({ _id: _id }, updateDoc);
    case 'bonus':
        bonusData.updateMany({ bonus_id: _id }, { $set: { category: category, subcategory: subcategory } });
        return await bonuses.updateOne({ _id: ObjectId(_id) }, updateDoc);
    }
}
