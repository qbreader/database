import { bonuses, sets, tossups } from '../collections.js';

// TODO: use a join inside an aggregation to make it faster
export default async function setValidation() {
    let total = 0;

    for (const set of await sets.find({}).toArray()) {
        const query = {
            'set._id': set._id,
            $or: [
                { 'set.name': { $ne: set.name } },
                { 'set.year': { $ne: set.year } },
                { 'set.standard': { $ne: set.standard } },
                { difficulty: { $ne: set.difficulty } },
            ]
        };

        const update = {
            $set: {
                'set.name': set.name,
                'set.year': set.year,
                'set.standard': set.standard,
                difficulty: set.difficulty,
            }
        };

        const { modifiedCount: tossupModifiedCount } = await tossups.updateMany(query, update);
        total += tossupModifiedCount;

        const { modifiedCount: bonusModifiedCount } = await bonuses.updateMany(query, update);
        total += bonusModifiedCount;

        if (tossupModifiedCount + bonusModifiedCount > 0) {
            console.log(set);
        }
    }

    return total;
}
