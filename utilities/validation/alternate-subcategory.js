import { bonuses, tossups } from '../collections.js';

import { bonusToString, tossupToString } from '../../stringify.js';

const categories = [
    'Literature',
];

const subcategories = [
    'Other Science',
    'Other Fine Arts',
    'Social Science',
];

const alternate_subcategories = [
    'Drama',
    'Long Fiction',
    'Poetry',
    'Short Fiction',
    'Misc Literature',
    'Math',
    'Astronomy',
    'Computer Science',
    'Earth Science',
    'Engineering',
    'Misc Science',
    'Architecture',
    'Dance',
    'Film',
    'Jazz',
    'Opera',
    'Photography',
    'Misc Arts',
    'Anthropology',
    'Economics',
    'Linguistics',
    'Psychology',
    'Sociology',
    'Other Social Science',
    'Beliefs',
    'Practices',
    null,
];

export default async function alternateSubcategoryValidation() {
    let valid = true;

    for (const tossup of await tossups.find({ category: { $in: categories }, alternate_subcategory: null }).toArray()) {
        console.log(tossupToString(tossup));
        valid = false;
    }

    for (const bonus of await bonuses.find({ category: { $in: categories }, alternate_subcategory: null }).toArray()) {
        console.log(bonusToString(bonus));
        valid = false;
    }

    for (const tossup of await tossups.find({ subcategory: { $in: subcategories }, alternate_subcategory: null }).toArray()) {
        console.log(tossupToString(tossup));
        valid = false;
    }

    for (const bonus of await bonuses.find({ subcategory: { $in: subcategories }, alternate_subcategory: null }).toArray()) {
        console.log(bonusToString(bonus));
        valid = false;
    }

    for (const tossup of await tossups.find({ alternate_subcategory: { $not: { $in: alternate_subcategories } } }).toArray()) {
        console.log(tossupToString(tossup));
        valid = false;
    }

    for (const bonus of await bonuses.find({ alternate_subcategory: { $not: { $in: alternate_subcategories } } }).toArray()) {
        console.log(bonusToString(bonus));
        valid = false;
    }

    return valid;
}
