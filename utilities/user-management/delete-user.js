import { perTossupData, perBonusData, tossupStars, bonusStars, users } from '../collections.js';

export default async function deleteUser (_id) {
  console.log(await users.deleteOne({ _id }));
  console.log(await perTossupData.deleteMany(
    { 'data.user_id': _id },
    { $pull: { data: { user_id: _id } } }
  ));
  console.log(await perBonusData.deleteMany(
    { 'data.user_id': _id },
    { $pull: { data: { user_id: _id } } }
  ));
  console.log(await tossupStars.deleteMany({ user_id: _id }));
  console.log(await bonusStars.deleteMany({ user_id: _id }));
}
