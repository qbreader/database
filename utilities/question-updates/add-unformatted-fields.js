import { tossups, bonuses } from '../collections.js';


function removeHTML(string) {
    return string
        .replace(/<\/?(b|u|i|em)>/g, '');
}


function unformatString(string) {
    return string
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[\u2018-\u201B]/g, '\'')
        .replace(/[\u201C-\u201F]/g, '"')
        .replace(/[\u2026]/g, '...')
        .replace(/[\u2032-\u2037]/g, '\'')
        .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
        .replace(/\u0142/g, 'l'); // ł -> l
}


async function addUnformattedFieldsTossup(printFrequency) {
    const total = await tossups.countDocuments({});
    const step = Math.floor(total / printFrequency);
    const bulk = tossups.initializeUnorderedBulkOp();
    const cursor = tossups.find({});
    let counter = 0;

    for (let tossup = await cursor.next(); tossup != null; tossup = await cursor.next()) {
        bulk.find({ _id: tossup._id }).updateOne({
            $set: {
                unformatted_answer: unformatString(removeHTML(tossup.formatted_answer ?? tossup.answer)),
                unformatted_question: unformatString(removeHTML(tossup.question)),
            },
        });

        if (++counter % step === 0) {
            console.log(`${counter} / ${total}`);
        }
    }

    return (await bulk.execute()).modifiedCount;
}


async function addUnformattedFieldsBonus(printFrequency) {
    const total = await bonuses.countDocuments({});
    const step = Math.floor(total / printFrequency);
    const bulk = bonuses.initializeUnorderedBulkOp();
    const cursor = bonuses.find({});
    let counter = 0;

    for (let bonus = await cursor.next(); bonus != null; bonus = await cursor.next()) {
        bulk.find({ _id: bonus._id }).updateOne({
            $set: {
                unformatted_leadin: unformatString(removeHTML(bonus.leadin)),
                unformatted_parts: bonus.parts.map(part => unformatString(removeHTML(part))),
                unformatted_answers: (bonus.formatted_answers ?? bonus.answers).map(answer => unformatString(removeHTML(answer))),
            },
        });

        if (++counter % step === 0) {
            console.log(`${counter} / ${total}`);
        }
    }

    return (await bulk.execute()).modifiedCount;
}


export default async function addUnformattedFields(printFrequency = 10) {
    const modifiedCount = await Promise.all([
        addUnformattedFieldsTossup(printFrequency),
        addUnformattedFieldsBonus(printFrequency),
    ]);

    return modifiedCount.reduce((a, b) => a + b);
}
