import { bonusToString } from '../../stringify.js';
import { perBonusData, bonuses } from '../collections.js';

export default async function printMostReadBonuses (limit = 1) {
  const results = await perBonusData.aggregate([
    { $addFields: { count: { $size: '$data' } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]).toArray();
  for (const result of results) {
    const question = await bonuses.findOne({ _id: result._id });
    console.log(`Number of times read: ${result.count}`);
    console.log(bonusToString(question));
  }
}
