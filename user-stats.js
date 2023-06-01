require('dotenv').config();

const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
    // client.close();
});

const accountInfo = client.db('account-info');
const tossupData = accountInfo.collection('tossup-data');
const bonusData = accountInfo.collection('bonus-data');

/**
 *
 * @param {Number} limit - the max number of users to return
 * @param {"tossup" | "bonus"} type - whether to use tossup or bonus data
 * @returns {Promise<Array<{
 * username: String,
 * _id: String,
 * count: Number
 * }>>} - an array of objects
 */
async function getMostActiveUsers(limit, type = 'tossup') {
    const aggregation = [
        { $group: {
            _id: '$user_id',
            count: { '$sum': 1 }
        } },
        { $sort: {
            count: -1
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
        { $limit: limit }
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
