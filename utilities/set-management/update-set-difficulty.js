import { sets, perTossupData, perBonusData, tossups, bonuses } from '../collections.js';

export default async function updateSetDifficulty (setName, difficulty) {
  const result = await sets.findOneAndUpdate(
    { name: setName },
    { $set: { difficulty } }
  );
  const { _id } = result.value;

  console.log(await perTossupData.updateMany(
    { set_id: _id },
    { $set: { difficulty } }
  ));

  console.log(await perBonusData.updateMany(
    { set_id: _id },
    { $set: { difficulty } }
  ));

  console.log(await tossups.updateMany(
    { 'set._id': _id },
    { $set: { difficulty, updatedAt: new Date() } }
  ));

  console.log(await bonuses.updateMany(
    { 'set._id': _id },
    { $set: { difficulty, updatedAt: new Date() } }
  ));
}
