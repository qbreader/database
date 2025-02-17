import { bonuses, tossups } from '../collections.js';

export default async function deleteDeprecatedFields (verbose = true) {
  const update = {
    $unset: {
      questionNumber: '',
      packet_id: '',
      packetName: '',
      packetNumber: '',
      set_id: '',
      setName: '',
      setYear: '',
      type: ''
    }
  };

  const tossupResult = await tossups.updateMany({}, update);
  const bonusResult = await bonuses.updateMany({}, update);

  if (verbose) {
    console.log(`Tossups: ${tossupResult.modifiedCount}`);
    console.log(`Bonuses: ${bonusResult.modifiedCount}`);
  }
}
