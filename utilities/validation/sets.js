import { bonuses, tossups } from '../collections.js';


export default async function setValidation() {
    const aggregation = [
        { $lookup: { from: 'sets', localField: 'set._id', foreignField: '_id', as: 'correctSet' } },
        { $unwind: '$correctSet' },
        { $match: { $or: [
            { $expr: { $ne: ['$correctSet.name', '$set.name'] } },
            { $expr: { $ne: ['$correctSet.standard', '$set.standard'] } },
            { $expr: { $ne: ['$correctSet.year', '$set.year'] } },
            { $expr: { $ne: ['$correctSet.difficulty', '$difficulty'] } },
        ] } },
    ];

    let total = 0;

    const tossupResults = await tossups.aggregate(aggregation).toArray();
    total += tossupResults.length;
    const bulkTossup = tossups.initializeUnorderedBulkOp();

    for (const tossup of tossupResults) {
        bulkTossup.find({ _id: tossup._id }).updateOne({
            $set: {
                'set.name': tossup.correctSet.name,
                'set.year': tossup.correctSet.year,
                'set.standard': tossup.correctSet.standard,
                difficulty: tossup.correctSet.difficulty,
            }
        });
    }

    if (tossupResults.length > 0) {
        await bulkTossup.execute();
    }

    const bonusResults = await bonuses.aggregate(aggregation).toArray();
    total += bonusResults.length;
    const bulkBonus = bonuses.initializeUnorderedBulkOp();

    for (const bonus of bonusResults) {
        bulkBonus.find({ _id: bonus._id }).updateOne({
            $set: {
                'set.name': bonus.correctSet.name,
                'set.year': bonus.correctSet.year,
                'set.standard': bonus.correctSet.standard,
                difficulty: bonus.correctSet.difficulty,
            }
        });
    }

    if (bonusResults.length > 0) {
        await bulkBonus.execute();
    }

    return total;
}
