import { packets, tossups, bonuses } from '../collections.js';

export default async function updatePacketNumber (packetId, packetNumber) {
  const packet = await packets.findOneAndUpdate(
    { _id: packetId },
    { $set: { number: packetNumber } }
  );

  const tossupResult = await tossups.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': packet.name, 'packet.number': packetNumber } }
  );

  const bonusResult = await bonuses.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': packet.name, 'packet.number': packetNumber } }
  );

  return { tossupResult, bonusResult, packet };
}
