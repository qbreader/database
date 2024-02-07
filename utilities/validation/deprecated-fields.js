import { bonuses, tossups } from '../collections.js';


export default async function deprecatedFieldsValidation(verbose = true) {
    let total = 0;

    const query = {
        $or: [
            { $expr: { $ne: ['$number', '$questionNumber'] } },

            { $expr: { $ne: ['$packet_id', '$packet._id'] } },
            { $expr: { $ne: ['$packetName', '$packet.name'] } },
            { $expr: { $ne: ['$packetNumber', '$packet.number'] } },

            { $expr: { $ne: ['$set_id', '$set._id'] } },
            { $expr: { $ne: ['$setName', '$set.name'] } },
            { $expr: { $ne: ['$setYear', '$set.year'] } },
        ],
    };

    const update = [{
        $set: {
            number: '$questionNumber',

            packet_id: '$packet._id',
            packetName: '$packet.name',
            packetNumber: '$packet.number',

            set_id: '$set._id',
            setName: '$set.name',
            setYear: '$set.year',
        },
    }];

    const tossupResults = await tossups.updateMany(query, update);
    total += tossupResults.modifiedCount;

    if (verbose) {
        console.log(`Tossups: ${tossupResults.modifiedCount}`);
    }

    const bonusResults = await bonuses.updateMany(query, update);
    total += bonusResults.modifiedCount;

    if (verbose) {
        console.log(`Bonuses: ${bonusResults.modifiedCount}`);
    }

    await tossups.updateMany({ $expr: { $ne: ['$type', 'tossup'] } }, { $set: { type: 'tossup' } });
    await bonuses.updateMany({ $expr: { $ne: ['$type', 'bonus'] } }, { $set: { type: 'bonus' } });

    return total;
}
