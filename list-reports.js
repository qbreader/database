import { HEADER, ENDC } from './bcolors.js';
import { tossupToString, bonusToString } from './stringify.js';
import { bonuses, closeConnection, tossups } from './utilities/collections.js';

const reportReasons = ['wrong-category', 'text-error', 'answer-checking', 'other'];

async function listReports ({ bashHighlighting = true, allowedReasons = reportReasons } = {}) {
  function printReports (reports) {
    for (let i = 0; i < reports.length; i++) {
      console.log(`${bashHighlighting ? HEADER : ''}Reason:${bashHighlighting ? ENDC : ''} ${reports[i].reason}`);
      console.log(`${bashHighlighting ? HEADER : ''}Description:${bashHighlighting ? ENDC : ''} ${reports[i].description}`);
      console.log();
    }
  }

  const aggregation = [
    { $match: { 'reports.reason': { $in: allowedReasons } } },
    { $addFields: { numberOfReports: { $size: '$reports' } } },
    { $sort: { numberOfReports: -1 } }
  ];

  for (const question of await tossups.aggregate(aggregation).toArray()) {
    console.log(tossupToString(question, bashHighlighting));
    printReports(question.reports);
  }

  for (const question of await bonuses.aggregate(aggregation).toArray()) {
    console.log(bonusToString(question, bashHighlighting));
    printReports(question.reports);
  }
}

// await listReports();
await listReports({ allowedReasons: ['wrong-category'] });
// await listReports({ allowedReasons: ['text-error'] });
// await listReports({ allowedReasons: ['answer-checking'] });
// await listReports({ allowedReasons: ['other'] });

await closeConnection();
