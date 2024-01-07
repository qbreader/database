import { bonuses } from '../collections.js';


export default async function sanitizeLeadin() {
    const regExp = /(?<=each:) {2}.*/i;
    const count = await bonuses.countDocuments({ leadin: { $regex: regExp } });
    console.log(count);

    let counter = 0;

    bonuses.find({ leadin: { $regex: regExp } }).forEach(question => {
        bonuses.updateOne(
            { _id: question._id },
            { $set: { leadin: question.leadin.replace(regExp, '').trim(), updatedAt: new Date() } }
        );

        counter++;
        if (counter % 100 === 0) {
            console.log(counter);
        }
    });

    return counter;
}
