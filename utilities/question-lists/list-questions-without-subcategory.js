import { tossups, bonuses } from '../collections.js';

export default async function listQuestionsWithoutSubcategory () {
  for (const tossup of await tossups.find({ subcategory: { $exists: false } }).toArray()) {
    const { _id } = tossup;
    const text = tossup.question + ' ' + tossup.answer;
    console.log(JSON.stringify({ _id, text, type: 'tossup' }));
  }

  bonuses.find({ subcategory: { $exists: false } })
    .forEach(question => {
      const { _id } = question;
      const text = question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');
      console.log(JSON.stringify({ _id, text, type: 'bonus' }));
    });
}
