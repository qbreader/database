import { bonuses, packets, tossups } from '../collections.js';

export default async function packetValidation (verbose = true) {
  const aggregation = [
    { $lookup: { from: 'packets', localField: 'packet._id', foreignField: '_id', as: 'correctPacket' } },
    { $unwind: '$correctPacket' },
    {
      $match: {
        $or: [
          { $expr: { $ne: ['$correctPacket.name', '$packet.name'] } },
          { $expr: { $ne: ['$correctPacket.number', '$packet.number'] } }
        ]
      }
    }
  ];

  let total = 0;

  const tossupResults = await tossups.aggregate(aggregation).toArray();
  total += tossupResults.length;
  const bulkTossup = tossups.initializeUnorderedBulkOp();

  for (const tossup of tossupResults) {
    bulkTossup.find({ _id: tossup._id }).updateOne({
      $set: {
        'packet.name': tossup.correctPacket.name,
        'packet.number': tossup.correctPacket.number
      }
    });
  }

  if (tossupResults.length > 0) {
    await bulkTossup.execute();
  }

  if (verbose) {
    console.log(`Validated ${tossupResults.length} tossups.`);
  }

  const bonusResults = await bonuses.aggregate(aggregation).toArray();
  total += bonusResults.length;
  const bulkBonus = bonuses.initializeUnorderedBulkOp();

  for (const bonus of bonusResults) {
    bulkBonus.find({ _id: bonus._id }).updateOne({
      $set: {
        'packet.name': bonus.correctPacket.name,
        'packet.number': bonus.correctPacket.number
      }
    });
  }

  if (bonusResults.length > 0) {
    // await bulkBonus.execute();
  }

  if (verbose) {
    console.log(`Validated ${bonusResults.length} bonuses.`);
  }

  const packetResults = await packets.aggregate([
    { $lookup: { from: 'sets', localField: 'set._id', foreignField: '_id', as: 'correctSet' } },
    { $unwind: '$correctSet' },
    { $match: { $expr: { $ne: ['$correctSet.name', '$set.name'] } } }
  ]).toArray();

  total += packetResults.length;
  const bulkPacket = packets.initializeUnorderedBulkOp();

  for (const packet of packetResults) {
    bulkPacket.find({ _id: packet._id }).updateOne({
      $set: {
        'set.name': packet.correctSet.name
      }
    });
  }

  if (packetResults.length > 0) {
    await bulkPacket.execute();
  }

  if (verbose) {
    console.log(`Validated ${packetResults.length} packets.`);
  }

  return total;
}
