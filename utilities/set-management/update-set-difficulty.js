import { sets, tossupData, bonusData, tossups, bonuses } from '../collections.js';


export default async function updateSetDifficulty(setName, difficulty) {
    const result = await sets.findOneAndUpdate(
        { name: setName },
        { $set: { difficulty: difficulty } },
    );
    const { _id } = result.value;

    console.log(await tossupData.updateMany(
        { set_id: _id },
        { $set: { difficulty: difficulty } },
    ));

    console.log(await bonusData.updateMany(
        { set_id: _id },
        { $set: { difficulty: difficulty } },
    ));

    console.log(await tossups.updateMany(
        { 'set._id': _id },
        { $set: { difficulty: difficulty, updatedAt: new Date() } },
    ));

    console.log(await bonuses.updateMany(
        { 'set._id': _id },
        { $set: { difficulty: difficulty, updatedAt: new Date() } },
    ));
}
