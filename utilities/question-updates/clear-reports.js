import { tossups, bonuses } from '../collections.js';

export default async function clearReports () {
  console.log(await tossups.updateMany(
    { reports: { $exists: true } },
    { $unset: { reports: '' } }
  ));

  console.log(await bonuses.updateMany(
    { reports: { $exists: true } },
    { $unset: { reports: '' } }
  ));
}
