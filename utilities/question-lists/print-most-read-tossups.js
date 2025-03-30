import { tossupToString } from '../../stringify.js';
import { perTossupData, tossups } from '../collections.js';

export default async function printMostReadTossups (limit = 1) {
  const results = await perTossupData.aggregate([
    { $addFields: { count: { $size: '$data' } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]).toArray();
  for (const result of results) {
    const question = await tossups.findOne({ _id: result._id });
    console.log(`Number of times read: ${result.count}`);
    console.log(tossupToString(question));
  }
}
