import { sets, tossups, bonuses, packets, perTossupData, perBonusData } from '../collections.js';

export default async function deleteSet (setName) {
  const result = await sets.findOneAndDelete({ name: setName });
  if (!result) {
    console.log('Set not found');
    return;
  }
  const { _id } = result;

  console.log(await tossups.deleteMany({ 'set._id': _id }));
  console.log(await bonuses.deleteMany({ 'set._id': _id }));
  console.log(await packets.deleteMany({ 'set._id': _id }));
  console.log(await perTossupData.deleteMany({ set_id: _id }));
  console.log(await perBonusData.deleteMany({ set_id: _id }));
}
