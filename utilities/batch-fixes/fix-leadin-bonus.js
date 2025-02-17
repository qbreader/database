import { bonuses } from '../collections.js';

/**
 * Fix the word "Bonus:" in the leadin of bonuses.
 * @param {*} printFrequency
 */
export default async function fixLeadinBonus (printFrequency = 10) {
  const total = await bonuses.countDocuments({ leadin: /^bonus: /i });
  const step = Math.floor(total / printFrequency);
  let counter = 0;

  for (const bonus of await bonuses.find({ leadin: /^bonus: /i }).toArray()) {
    if (++counter % step === 0) {
      console.log(`${counter} / ${total}`);
    }

    await bonuses.updateOne(
      { _id: bonus._id },
      {
        $set: {
          leadin: bonus.leadin.replace(/^bonus: */i, ''),
          leadin_sanitized: bonus.leadin_sanitized.replace(/^bonus: */i, '')
        }
      }
    );
  }
}
