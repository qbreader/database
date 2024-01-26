import { bonusToString } from '../../stringify.js';
import { bonusData, bonuses } from '../collections.js';


export default async function printMostReadBonuses(limit = 1) {
    await bonusData.aggregate([
        { $match: { bonus_id: { $exists: true } } },
        { $group: { _id: '$bonus_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit },
    ]).forEach(result => {
        bonuses.findOne({ _id: result._id }).then(question => {
            console.log(`Number of times read: ${result.count}`);
            console.log(bonusToString(question));
        });
    });
}
