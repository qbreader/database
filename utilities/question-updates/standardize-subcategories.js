import updateOneSubcategory from './update-one-subcategory.js';

import { tossups, bonuses } from '../collections.js';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const cats = require('../../subcat-to-cat.json');
const subcats = require('../../standardize-subcats.json');

export default function standardizeSubcategories() {
    let counter = 0;

    tossups.find(
        { subcategory: { $nin: Object.keys(cats) } },
        { projection: { _id: 1, category: 1, subcategory: 1 } }
    ).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) return;

        if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            updateOneSubcategory(question._id, 'tossup', question.subcategory, false);
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
        }
    });

    bonuses.find(
        { subcategory: { $nin: Object.keys(cats) } },
        { projection: { _id: 1, category: 1, subcategory: 1 } }
    ).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) return;

        if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            updateOneSubcategory(question._id, 'bonus', question.subcategory, false);
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
        }
    });
}
