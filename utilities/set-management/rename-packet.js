import { packets, tossups, bonuses } from '../collections.js';

export default async function renamePacket (setName, packetNumber, newPacketName) {
  const packet = await packets.findOne({ 'set.name': setName, number: packetNumber });

  console.log(await tossups.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': newPacketName, updatedAt: new Date() } }
  ));

  console.log(await bonuses.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': newPacketName, updatedAt: new Date() } }
  ));
}
