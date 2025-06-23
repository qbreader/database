import { bonuses, tossups } from '../collections.js';

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
  'Movies',
  'Music',
  'Sports',
  'Television',
  'Video Games',
  'Other Pop Culture'
];

export default async function subcategoryValidation () {
  let valid = true;

  for (const tossup of await tossups.find({ subcategory: { $not: { $in: subcategories } } }).toArray()) {
    console.log(`Tossup ${tossup._id} has ${tossup.category} / ${tossup.subcategory} subcategory, which is not in the list of valid subcategories.`);
    valid = false;
  }

  for (const bonus of await bonuses.find({ subcategory: { $not: { $in: subcategories } } }).toArray()) {
    console.log(`Bonus ${bonus._id} has ${bonus.category} / ${bonus.subcategory} subcategory, which is not in the list of valid subcategories.`);
    valid = false;
  }

  return valid;
}
