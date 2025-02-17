import { tossups } from '../collections.js';

export default async function removeTrailingBonusesString () {
  const count = await tossups.countDocuments({ answer: /bonuses/i });
  console.log(count);

  tossups.find({ answer: /bonuses/i }).forEach(tossup => {
    tossups.updateOne(
      { _id: tossup._id },
      {
        $set: {
          answer: tossup.answer.replace(/bonuses.*/i, ''),
          updatedAt: new Date()
        }
      }
    );

    if (tossup.formatted_answer) {
      tossups.updateOne(
        { _id: tossup._id },
        { $set: { formatted_answer: tossup.formatted_answer.replace(/(<b><u>)?bonuses.*/i, '') } }
      );
    }
  });
}
