import 'dotenv/config';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
    // await printMostActiveUsers(10, 'tossup');
    // await printUserStats('');
    // console.log(array.map(user => user.count));
    // console.log(array.map((user) => user.count).reduce((a, b) => a + b));
    client.close();
});

const accountInfo = client.db('account-info');
const tossupData = accountInfo.collection('tossup-data');
const bonusData = accountInfo.collection('bonus-data');
const users = accountInfo.collection('users');

/**
 *
 * @param {Number} limit - the max number of users to return
 * @param {"tossup" | "bonus"} type - whether to use tossup or bonus data
 * @returns {Promise<Array<{
 * username: String,
 * _id: String,
 * count: Number
 * }>>} an array of objects
 */
async function getMostActiveUsers(limit, type = 'tossup') {
    const aggregation = [
        { $group: {
            _id: '$user_id',
            count: { '$sum': 1 }
        } },
        { $sort: {
            count: 1
        } },
        { $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
        } },
        { $project: {
            username: { $arrayElemAt: [ '$user.username', 0 ] },
            _id: 1,
            count: 1,
        } },
        { $limit: limit },
    ];

    switch (type) {
    case 'tossup':
        return await tossupData.aggregate(aggregation).toArray();
    case 'bonus':
        return await bonusData.aggregate(aggregation).toArray();
    }
}


/**
 * Nicely prints the most active users.
 * @param {Number} limit - the max number of users to print
 * @param {"tossup" | "bonus"} type - whether to use tossup or bonus data
 * @returns {Promise<void>}
 */
async function printMostActiveUsers(limit = 10, type = 'tossup') {
    const result = await getMostActiveUsers(limit, type);
    result.forEach((user, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${user.username} (${user.count})`);
    });
}


async function printUserStats(username) {
    const { _id: user_id } = await users.findOne({ username: username });
    const tossupCount = await tossupData.countDocuments({ user_id: user_id });
    const bonusCount = await bonusData.countDocuments({ user_id: user_id });

    const aggregation = (count) => [
        { $group: {
            _id: '$user_id',
            count: { '$sum': 1 }
        } },
        { $match: {
            count: { $gte: count }
        } },
        { $count: 'position' }
    ];

    const { position: tossupPosition } = (await tossupData.aggregate(aggregation(tossupCount)).toArray())[0];
    const { position: bonusPosition } = (await bonusData.aggregate(aggregation(bonusCount)).toArray())[0];

    console.log(`User: ${username} (${user_id}))`);
    console.log(`Tossups: ${tossupCount} (#${tossupPosition})`);
    console.log(`Bonuses: ${bonusCount} (#${bonusPosition})`);
}
