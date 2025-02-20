import 'dotenv/config';

import { HEADER, ENDC } from './bcolors.js';
import { tossupToString, bonusToString } from './stringify.js';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
  console.log('connected to mongodb');
  // await listReports();
  // await listReports({ allowedReasons: [ 'wrong-category' ] });
  // await listReports({ allowedReasons: [ 'text-error' ] });
  // await listReports({ allowedReasons: [ 'answer-checking' ] });
  // await listReports({ allowedReasons: [ 'other' ] });
  client.close();
});

const database = client.db('qbreader');
const tossups = database.collection('tossups');
const bonuses = database.collection('bonuses');

const reportReasons = ['wrong-category', 'text-error', 'answer-checking', 'other'];

async function listReports ({ bashHighlighting = true, allowedReasons = reportReasons } = {}) {
  await tossups.aggregate([
    { $match: { 'reports.reason': { $in: allowedReasons } } },
    { $addFields: { numberOfReports: { $size: '$reports' } } },
    { $sort: { numberOfReports: -1 } }
  ]).forEach(async question => {
    console.log(tossupToString(question, bashHighlighting));

    for (let i = 0; i < question.reports.length; i++) {
      console.log(`${bashHighlighting ? HEADER : ''}Reason:${bashHighlighting ? ENDC : ''} ${question.reports[i].reason}`);
      console.log(`${bashHighlighting ? HEADER : ''}Description:${bashHighlighting ? ENDC : ''} ${question.reports[i].description}`);
      console.log();
    }
  });

  await bonuses.aggregate([
    { $match: { 'reports.reason': { $in: allowedReasons } } },
    { $addFields: { numberOfReports: { $size: '$reports' } } },
    { $sort: { numberOfReports: -1 } }
  ]).forEach(async question => {
    console.log(bonusToString(question, bashHighlighting));

    for (let i = 0; i < question.reports.length; i++) {
      console.log(`${bashHighlighting ? HEADER : ''}Reason:${bashHighlighting ? ENDC : ''} ${question.reports[i].reason}`);
      console.log(`${bashHighlighting ? HEADER : ''}Description:${bashHighlighting ? ENDC : ''} ${question.reports[i].description}`);
      console.log();
    }
  });
}
