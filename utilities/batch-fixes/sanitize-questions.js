import { tossups, bonuses } from '../collections.js';

/**
 * Remove HTML tags from unformatted answer fields.
 */
export default async function sanitizeQuestions() {
    console.log('tossups:', await tossups.countDocuments({ answer: /<\/?[biu]>/ }));
    for (const tossup of await tossups.find({ answer: /<\/?[biu]>/ }).toArray()) {
        await tossups.updateOne(
            { _id: tossup._id },
            { $set: { answer: tossup.answer.replace(/<\/?[biu]>/g, ''), updatedAt: new Date() } }
        );
    }

    console.log('bonuses:', await bonuses.countDocuments({ answers: /<\/?[biu]>/ }));
    for (const bonus of await bonuses.find({ answers: /<\/?[biu]>/ }).toArray()) {
        await bonuses.updateOne(
            { _id: bonus._id },
            { $set: { answers: bonus.answers.map(answer => answer.replace(/<\/?[biu]>/g, '')), updatedAt: new Date() } }
        );
    }
}
