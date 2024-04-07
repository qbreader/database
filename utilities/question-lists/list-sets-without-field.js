import { tossups, bonuses } from '../collections.js';

export default async function listSetsWithoutField(field) {
    for (const set of await tossups.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$set.name' } },
    ]).toArray()) {
        console.log(set._id);
    }

    for (const set of await bonuses.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$set.name' } },
    ]).toArray()) {
        console.log(set._id);
    }
}
