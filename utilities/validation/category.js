import { bonuses, tossups } from '../collections.js';

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
  'Pop Culture'
];

export default async function categoryValidation () {
  let valid = true;

  for (const tossup of await tossups.find({ category: { $not: { $in: categories } } }).toArray()) {
    console.log(`Tossup ${tossup._id} has ${tossup.category} category, which is not in the list of valid categories.`);
    valid = false;
  }

  for (const bonus of await bonuses.find({ category: { $not: { $in: categories } } }).toArray()) {
    console.log(`Bonus ${bonus._id} has ${bonus.category} category, which is not in the list of valid categories.`);
    valid = false;
  }

  return valid;
}
