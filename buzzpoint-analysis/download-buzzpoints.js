import { tossupData } from '../utilities/collections.js';

const cursor = tossupData.find(
    {},
    { projection: { _id: 1, celerity: 1, isCorrect: 1, difficulty: 1, subcategory: 1, alternate_subcategory: 1 } },
);

let current;
do {
    current = await cursor.next();
    console.log(JSON.stringify(current));
} while (current);
