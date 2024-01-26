import { tossups, bonuses } from '../collections.js';

export default function clearReports() {
    tossups.updateMany(
        { reports: { $exists: true } },
        { $unset: { reports: '' } },
    ).then(result => {
        console.log(result);
    });

    bonuses.updateMany(
        { reports: { $exists: true } },
        { $unset: { reports: '' } },
    ).then(result => {
        console.log(result);
    });
}
