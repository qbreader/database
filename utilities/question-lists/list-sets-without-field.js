import { tossups, bonuses } from '../collections.js';

export default function listSetsWithoutField(field) {
    tossups.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$set.name' } },
    ]).forEach(set => {
        console.log(set._id);
    });

    bonuses.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$set.name' } },
    ]).forEach(set => {
        console.log(set._id);
    });
}
