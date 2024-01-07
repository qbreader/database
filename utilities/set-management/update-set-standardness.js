import { sets, tossups, bonuses } from '../collections.js';


export default async function updateSetStandardness(setName, standard) {
    const set = await sets.findOneAndUpdate(
        { name: setName },
        { $set: { standard: standard } }
    );

    const { _id } = set.value;

    console.log(
        await tossups.updateMany(
            { 'set._id': _id },
            { $set: { 'set.standard': standard, updatedAt: new Date() } }
        )
    );

    console.log(
        await bonuses.updateMany(
            { 'set._id': _id },
            { $set: { 'set.standard': standard, updatedAt: new Date() } }
        )
    );
}
