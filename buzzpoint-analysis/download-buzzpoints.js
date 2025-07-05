import { perTossupData } from '../utilities/collections.js';

const cursor = perTossupData.aggregate([
  { $unwind: '$data' },
  { $project: { _id: 0, tossup_id: '$_id', celerity: '$data.celerity', isCorrect: '$data.isCorrect', difficulty: 1, subcategory: 1, alternate_subcategory: 1 } }
]);

let current;
do {
  current = await cursor.next();
  console.log(JSON.stringify(current));
} while (current);
