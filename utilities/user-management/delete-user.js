import { tossupData, bonusData, tossupStars, bonusStars, users } from '../collections.js';

export default async function deleteUser (_id) {
    console.log(await users.deleteOne({ _id }));
    console.log(await tossupData.deleteMany({ user_id: _id }));
    console.log(await bonusData.deleteMany({ user_id: _id }));
    console.log(await tossupStars.deleteMany({ user_id: _id }));
    console.log(await bonusStars.deleteMany({ user_id: _id }));
}
