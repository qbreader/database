import { bonuses, tossups } from '../collections.js';

import { bonusToString, tossupToString } from '../../stringify.js';

const subcategories = [
  'American Literature',
  'British Literature',
  'Classical Literature',
  'European Literature',
  'World Literature',
  'Other Literature',
  'American History',
  'Ancient History',
  'European History',
  'World History',
  'Other History',
  'Biology',
  'Chemistry',
  'Physics',
  'Other Science',
  'Visual Fine Arts',
  'Auditory Fine Arts',
  'Other Fine Arts',
  'Religion',
  'Mythology',
  'Philosophy',
  'Social Science',
  'Current Events',
  'Geography',
  'Other Academic',
  'Trash'
];

export default async function subcategoryValidation () {
  let valid = true;

  for (const tossup of await tossups.find({ subcategory: { $not: { $in: subcategories } } }).toArray()) {
    console.log(tossupToString(tossup));
    valid = false;
  }

  for (const bonus of await bonuses.find({ subcategory: { $not: { $in: subcategories } } }).toArray()) {
    console.log(bonusToString(bonus));
    valid = false;
  }

  return valid;
}
