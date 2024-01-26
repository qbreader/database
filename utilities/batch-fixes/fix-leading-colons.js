import { tossups, bonuses } from '../collections.js';


export default async function fixLeadingColons() {
    console.log(await tossups.countDocuments({ formatted_answer: { $regex: /^:/ } }));
    await tossups.find({ formatted_answer: { $regex: /^:/ } }).forEach(tossup => {
        tossups.updateOne(
            { _id: tossup._id },
            {
                $set: {
                    formatted_answer: tossup.formatted_answer.replace(/^:/, '').trim(),
                    answer: tossup.answer.replace(/^:/, '').trim(),
                },
            },
        );
    });
    console.log('tossups done');

    console.log(await bonuses.countDocuments({ formatted_answers: { $regex: /^:/ } }));
    await bonuses.find({ formatted_answers: { $regex: /^:/ } }).forEach(bonus => {
        bonuses.updateOne(
            { _id: bonus._id },
            {
                $set: {
                    formatted_answers: bonus.formatted_answers.map(answer => answer.replace(/^:/, '').trim()),
                    answers: bonus.answers.map(answer => answer.replace(/^:/, '').trim()),
                },
            },
        );
    });
    console.log('bonuses done');
}
