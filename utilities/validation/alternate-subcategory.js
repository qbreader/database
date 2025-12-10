import { bonuses, tossups } from '../collections.js';
import { CATEGORY_TO_ALTERNATE_SUBCATEGORY, SUBCATEGORY_TO_SUBSUBCATEGORY } from '../../categories.js';

const categories = [
  'Literature'
];

const subcategories = [
  'Other Science',
  'Other Fine Arts',
  'Social Science'
];

const alternateSubcategories = [
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
  'Musicals',
  'Opera',
  'Photography',
  'Misc Arts',
  'Anthropology',
  'Economics',
  'Linguistics',
  'Psychology',
  'Sociology',
  'Other Social Science',
  null
];

export default async function alternateSubcategoryValidation () {
  let total = 0;

  for (const tossup of await tossups.find({ category: { $in: categories }, alternate_subcategory: null }).toArray()) {
    console.log(`Tossup ${tossup._id} has ${tossup.category} category and no alternate subcategory.`);
    total++;
  }

  for (const bonus of await bonuses.find({ category: { $in: categories }, alternate_subcategory: null }).toArray()) {
    console.log(`Bonus ${bonus._id} has ${bonus.category} category and no alternate subcategory.`);
    total++;
  }

  for (const tossup of await tossups.find({ subcategory: { $in: subcategories }, alternate_subcategory: null }).toArray()) {
    console.log(`Tossup ${tossup._id} has ${tossup.category} / ${tossup.subcategory} subcategory and no alternate subcategory.`);
    total++;
  }

  for (const bonus of await bonuses.find({ subcategory: { $in: subcategories }, alternate_subcategory: null }).toArray()) {
    console.log(`Bonus ${bonus._id} has ${bonus.category} / ${bonus.subcategory} subcategory and no alternate subcategory.`);
    total++;
  }

  for (const tossup of await tossups.find({ alternate_subcategory: { $not: { $in: alternateSubcategories } } }).toArray()) {
    console.log(`Tossup ${tossup._id} has alternate subcategory ${tossup.alternate_subcategory}, which is not in the list of valid alternate subcategories.`);
    total++;
  }

  for (const bonus of await bonuses.find({ alternate_subcategory: { $not: { $in: alternateSubcategories } } }).toArray()) {
    console.log(`Bonus ${bonus._id} has alternate subcategory ${bonus.alternate_subcategory}, which is not in the list of valid alternate subcategories.`);
    total++;
  }

  for (const [category, validAlternateSubcategories] of Object.entries(CATEGORY_TO_ALTERNATE_SUBCATEGORY)) {
    for (const tossup of await tossups.find({ category, alternate_subcategory: { $not: { $in: validAlternateSubcategories } } }).toArray()) {
      console.log(`Tossup ${tossup._id} has category ${category} but alternate subcategory ${tossup.alternate_subcategory}, which is not valid for that category.`);
      total++;
    }

    for (const bonus of await bonuses.find({ category, alternate_subcategory: { $not: { $in: validAlternateSubcategories } } }).toArray()) {
      console.log(`Bonus ${bonus._id} has category ${category} but alternate subcategory ${bonus.alternate_subcategory}, which is not valid for that category.`);
      total++;
    }
  }

  for (const [subcategory, validSubsubcategories] of Object.entries(SUBCATEGORY_TO_SUBSUBCATEGORY)) {
    for (const tossup of await tossups.find({ subcategory, alternate_subcategory: { $not: { $in: validSubsubcategories } } }).toArray()) {
      console.log(`Tossup ${tossup._id} has subcategory ${subcategory} but alternate subcategory ${tossup.alternate_subcategory}, which is not valid for that subcategory.`);
      total++;
    }

    for (const bonus of await bonuses.find({ subcategory, alternate_subcategory: { $not: { $in: validSubsubcategories } } }).toArray()) {
      console.log(`Bonus ${bonus._id} has subcategory ${subcategory} but alternate subcategory ${bonus.alternate_subcategory}, which is not valid for that subcategory.`);
      total++;
    }
  }

  return total;
}
