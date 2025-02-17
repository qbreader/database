import 'dotenv/config';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
await client.connect();

console.log('connected to mongodb');

const questionDatabase = client.db('qbreader');
export const sets = questionDatabase.collection('sets');
export const tossups = questionDatabase.collection('tossups');
export const bonuses = questionDatabase.collection('bonuses');
export const packets = questionDatabase.collection('packets');

const accountInfo = client.db('account-info');
export const tossupData = accountInfo.collection('tossup-data');
export const bonusData = accountInfo.collection('bonus-data');
export const tossupStars = accountInfo.collection('tossup-stars');
export const bonusStars = accountInfo.collection('bonus-stars');
export const users = accountInfo.collection('users');

export const closeConnection = async () => {
    await client.close();
};
