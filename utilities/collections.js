import { client } from '../core/mongodb-client.js';

const questionDatabase = client.db('qbreader');
export const sets = questionDatabase.collection('sets');
export const tossups = questionDatabase.collection('tossups');
export const bonuses = questionDatabase.collection('bonuses');
export const packets = questionDatabase.collection('packets');

const accountInfo = client.db('account-info');
export const perTossupData = accountInfo.collection('per-tossup-data');
export const perBonusData = accountInfo.collection('per-bonus-data');
export const tossupStars = accountInfo.collection('tossup-stars');
export const bonusStars = accountInfo.collection('bonus-stars');
export const users = accountInfo.collection('users');
