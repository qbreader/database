import alternateSubcategoryValidation from './alternate-subcategory.js';
import bonusesValidation from './bonuses.js';
import categoryValidation from './category.js';
import deprecatedFieldsValidation from './deprecated-fields.js';
import packetValidation from './packets.js';
import setValidation from './sets.js';
import subcategoryValidation from './subcategory.js';

export default async function everythingValidation (verbose = true) {
  let total = 0;

  total += await alternateSubcategoryValidation(verbose);
  total += await categoryValidation(verbose);
  total += await subcategoryValidation(verbose);

  total += await bonusesValidation(verbose);
  total += await packetValidation(verbose);
  total += await setValidation(verbose);

  return total;
}
