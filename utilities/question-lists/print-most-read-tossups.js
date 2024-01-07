import { tossupToString } from '../../stringify.js';
import { tossupData, tossups } from '../collections.js';


export default async function printMostReadTossups(limit = 1) {
    await tossupData.aggregate([
        { $match: { tossup_id: { $exists: true } } },
        { $group: { _id: '$tossup_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
    ]).forEach(result => {
        tossups.findOne({ _id: result._id }).then(question => {
            console.log(`Number of times read: ${result.count}`);
            console.log(tossupToString(question));
        });
    });
}
