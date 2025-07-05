import 'dotenv/config';

import { client } from '../core/mongodb-client.js';
import * as qu from '../utilities/question-updates/index.js';

import { readFileSync } from 'fs';
import { ObjectId } from 'mongodb';

for (const [type, lines] of [
  ['tossup', readFileSync('output-tossup.txt', 'utf-8').split('\n')],
  ['bonus', readFileSync('output-bonus.txt', 'utf-8').split('\n')]
]) {
  for (const line of lines) {
    if (line.trim() === '') {
      continue;
    }
    const question = JSON.parse(line);
    await qu.updateSubcategory(new ObjectId(question._id), type, question.subcategory, question.alternate_subcategory);
  }
  console.log(`Finished processing ${type} with ${lines.length} lines`);
}
await client.close();
