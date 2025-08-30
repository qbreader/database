import * as bf from './utilities/batch-fixes/index.js';
import * as qu from './utilities/question-updates/index.js';
import * as sm from './utilities/set-management/index.js';
import * as val from './utilities/validation/index.js';
import * as um from './utilities/user-management/index.js';

import { client } from './core/mongodb-client.js';
import { bonuses, packets, sets, tossups, perTossupData, perBonusData } from './utilities/collections.js';

import { ObjectId } from 'mongodb';

await client.connect();

await client.close();
