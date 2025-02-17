import 'dotenv/config';

import * as qu from '../utilities/question-updates/index.js';

import { readFileSync } from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

// const lines = readFileSync('output-tossup.txt', 'utf-8').split('\n');
const lines = readFileSync('output-bonus.txt', 'utf-8').split('\n');

for (const line of lines) {
  const question = JSON.parse(line);
  await qu.updateSubcategory(new ObjectId(question._id), 'bonus', question.subcategory, question.alternate_subcategory);
}
