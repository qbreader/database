import updateSubcategory from './update-subcategory.js';

import { readFileSync } from 'fs';

/**
 * Each line of the file at `filename` should be a valid JSON object with a `_id`, `type`, and `subcategory` field.
 * This function updates each document located at `_id` with the corresponding `subcategory` and the appropriate `category`.
 * @param {String} filename the file from which to read in data for the categories
 */

export default async function updateManySubcategories (filename = 'input.txt') {
  const data = readFileSync(filename, { encoding: 'utf-8' });

  let counter = 0;

  for (const line of data.split('\n')) {
    if (line === '') { continue; }

    const { _id, subcategory, type } = JSON.parse(line);
    const result = await updateSubcategory(_id, type, subcategory, false);

    counter++;
    if (counter % 100 == 0) {
      console.log(counter);
      console.log(result);
    }
  }
}
