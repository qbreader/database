import { tossups } from '../collections.js';

export default async function boldPowermarks(printFrequency = 10) {
    const total = await tossups.countDocuments({ question: /\(\*\)/ });
    const step = Math.floor(total / printFrequency);
    const bulk = tossups.initializeUnorderedBulkOp();
    const cursor = tossups.find({ question: /\(\*\)/ });
    let counter = 0;

    for (let tossup = await cursor.next(); tossup != null; tossup = await cursor.next()) {
        bulk.find({ _id: tossup._id }).updateOne({
            $set: {
                question: '<b>' + tossup.question.replace(/\(\*\)/, '(*)</b>'),
            },
        });

        if (++counter % step === 0) {
            console.log(`${counter} / ${total}`);
        }
    }

    return (await bulk.execute()).modifiedCount;
}
