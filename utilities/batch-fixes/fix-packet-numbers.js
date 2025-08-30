import { packets } from '../collections.js';
import updatePacketNumber from '../set-management/update-packet-number.js';
import { client } from '../../core/mongodb-client.js';

export default async function fixPacketNumbers (setName) {
  await packets.dropIndex('set.name_1_number_1');

  const results = await packets.find({ 'set.name': setName }).toArray();
  for (const packet of results) {
    const packetNumber = parseInt(packet.name);
    if (isNaN(packetNumber)) {
      console.log(`Skipping packet ${packet._id} with name ${packet.name}`);
      continue;
    }
    const { tossupResult, bonusResult } = await updatePacketNumber(packet._id, packetNumber);
    console.log(`Updated packet ${packet._id} (${packet.name}) to number ${packetNumber}: ${tossupResult.modifiedCount} tossups and ${bonusResult.modifiedCount} bonuses.`);
  }

  await packets.createIndex({ 'set.name': 1, number: 1 }, { unique: true });
}

await client.close();
