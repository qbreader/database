import { bonuses, tossups } from '../collections.js';

import { bonusToString, tossupToString } from '../../stringify.js';

const categories = [
  'Literature',
  'History',
  'Science',
  'Fine Arts',
  'Religion',
  'Mythology',
  'Philosophy',
  'Social Science',
  'Current Events',
  'Geography',
  'Other Academic',
  'Trash'
];

export default async function categoryValidation () {
  let valid = true;

  for (const tossup of await tossups.find({ category: { $not: { $in: categories } } }).toArray()) {
    console.log(tossupToString(tossup));
    valid = false;
  }

  for (const bonus of await bonuses.find({ category: { $not: { $in: categories } } }).toArray()) {
    console.log(bonusToString(bonus));
    valid = false;
  }

  return valid;
}
