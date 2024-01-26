import { tossups, bonuses } from '../collections.js';

export default function listSetsWithAnswerFormatting() {
    tossups.aggregate([
        { $match: { formatted_answer: { $exists: true } } },
        { $group: { _id: '$set.name' } },
    ]).forEach(set => {
        console.log(set._id);
    });

    bonuses.aggregate([
        { $match: { formatted_answers: { $exists: true } } },
        { $group: { _id: '$set.name' } },
    ]).forEach(set => {
        console.log(set._id);
    });
}
