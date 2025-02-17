import { tossups, bonuses, tossupData, bonusData } from '../collections.js';

export default async function listAlternateSubcategories (update = false) {
  tossups.find({
    subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] }
  }).forEach(question => {
    const { _id } = question;
    const text = question.question + ' ' + question.answer;
    console.log(JSON.stringify({ _id, text, type: 'tossup' }));
  });

  bonuses.find({
    subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] }
  }).forEach(question => {
    const { _id } = question;
    const text = question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');
    console.log(JSON.stringify({ _id, text, type: 'bonus' }));
  });

  if (update) {
    console.log(await tossups.updateMany(
      { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
      { $rename: { subcategory: 'alternate_subcategory' } }
    ));

    console.log(await bonuses.updateMany(
      { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
      { $rename: { subcategory: 'alternate_subcategory' } }
    ));

    console.log(await tossupData.updateMany(
      { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
      { $rename: { subcategory: 'alternate_subcategory' } }
    ));

    console.log(await bonusData.updateMany(
      { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
      { $rename: { subcategory: 'alternate_subcategory' } }
    ));
  }
}
