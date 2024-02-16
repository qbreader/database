import { bonuses } from '../collections.js';


/**
 * Validates that the `parts`, `answers`, and `formatted_answers` (if it exists) have the same number of parts.
 */
export default async function bonusesValidation(verbose = true) {
    let total = 0;

    // Check that formatted_answers is an array, not an object
    for (const bonus of await bonuses.find({ formatted_answers: { $exists: true, $type: 'object' } }).toArray()) {
        total++;

        if (verbose) {
            console.log(`Bonus ${bonus._id} has a formatted_answers object`);
        }

        const array = [];
        for (let i = 0; i < Object.keys(bonus.formatted_answers).length; i++) {
            array.push(bonus.formatted_answers[i]);
        }

        await bonuses.updateOne(
            { _id: bonus._id },
            { $set: { formatted_answers: array } },
        );
    }

    // Check that parts and answers have the same number of parts
    const aggregation1 = [
        { '$addFields': {
            'parts_length': { '$size': '$parts' },
            'answers_length': { '$size': '$answers' },
        } },
        { '$addFields': {
            'valid': { '$eq': ['$parts_length', '$answers_length'] },
        } },
        { '$match': {
            'valid': false,
        } },
        { $sort: { 'answers_length': 1, 'set.year': 1 } },
    ];

    for (const bonus of await bonuses.aggregate(aggregation1).toArray()) {
        total++;
        if (verbose) {
            console.log(`Bonus ${bonus._id} has ${bonus.parts_length} parts and ${bonus.answers_length} answers`);
        }
    }

    // Check that answers and formatted_answers have the same number of parts
    const aggregation2 = [
        { '$match': {
            'formatted_answers': { '$exists': true },
        } },
        { '$addFields': {
            'formatted_answers_length': { '$size': '$formatted_answers' },
            'answers_length': { '$size': '$answers' },
        } },
        { '$addFields': {
            'valid': { '$eq': ['$formatted_answers_length', '$answers_length'] },
        } },
        { '$match': {
            'valid': false,
        } },
    ];

    for (const bonus of await bonuses.aggregate(aggregation2).toArray()) {
        total++;
        if (verbose) {
            console.log(`Bonus ${bonus._id} has ${bonus.formatted_answers_length} formatted_answers and ${bonus.answers_length} answers`);
        }
    }

    return total;
}
