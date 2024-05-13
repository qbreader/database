import { sets, tossups, bonuses, packets, tossupData, bonusData } from '../collections.js';


export default async function deleteSet(setName) {
    const result = await sets.findOneAndDelete({ name: setName });
    if (!result.value) {
        console.log('Set not found');
        return;
    }
    const { _id } = result.value;

    console.log(await tossups.deleteMany({ 'set._id': _id }));
    console.log(await bonuses.deleteMany({ 'set._id': _id }));
    console.log(await packets.deleteMany({ 'set._id': _id }));
    console.log(await tossupData.deleteMany({ set_id: _id }));
    console.log(await bonusData.deleteMany({ set_id: _id }));
}
