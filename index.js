import * as bf from './utilities/batch-fixes/index.js';

import { client } from './core/mongodb-client.js';
import { bonuses, packets, sets, tossups, perTossupData, perBonusData } from './utilities/collections.js';

import { ObjectId } from 'mongodb';

await client.connect();

await client.close();
