import 'dotenv/config';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader2.z35tynb.mongodb.net/?retryWrites=true&w=majority`;
export const client = new MongoClient(uri);
await client.connect();
console.log('connected to mongodb');

export async function closeConnection () {
  await client.close();
}
