import { packets, tossups, bonuses } from '../collections.js';


export default async function updatePacketNumber(packet_id, packetNumber) {
    const packet = await packets.findOneAndUpdate(
        { _id: packet_id },
        { $set: { number: packetNumber } }
    );

    console.log(await tossups.updateMany(
        { 'packet._id': packet._id },
        { $set: { 'packet.name': packet.name, 'packet.number': packetNumber } }
    ));

    console.log(await bonuses.updateMany(
        { 'packet._id': packet._id },
        { $set: { 'packet.name': packet.name, 'packet.number': packetNumber } }
    ));
}
