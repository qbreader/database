import { sets, tossups, bonuses, packets } from '../collections.js';


export default async function renameSet(oldName, newName) {
    const year = parseInt(newName.slice(0, 4));
    const set = await sets.findOneAndUpdate(
        { name: oldName },
        { $set: { name: newName, year } }
    ).then(result => result.value);

    console.log(await tossups.updateMany(
        { 'set._id': set._id },
        { $set: { 'set.name': newName, 'set.year': year, updatedAt: new Date() } }
    ));

    console.log(await bonuses.updateMany(
        { 'set._id': set._id },
        { $set: { 'set.name': newName, 'set.year': year, updatedAt: new Date() } }
    ));

    console.log(await packets.updateMany(
        { 'set._id': set._id },
        { $set: { 'set.name': newName } }
    ));
}
