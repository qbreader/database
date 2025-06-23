import { tossups, bonuses } from '../collections.js';

export default async function fixSpaces () {
  const fields = ['question', 'question_sanitized', 'answer', 'answer_sanitized', 'leadin', 'leadin_sanitized'];
  const arrayFields = ['parts', 'parts_sanitized', 'answers', 'answers_sanitized'];

  for (const field of fields) {
    console.log(field, await tossups.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
    console.log(field, await bonuses.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
  }

  for (const field of arrayFields) {
    console.log(field, await tossups.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
    console.log(field, await bonuses.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
  }

  let counter = 0;

  for (const field of fields) {
    console.log('updating', field);
    tossups.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
      question[field] = question[field]
        .replace(/\t/g, ' ')
        .replace(/ {2,}/g, ' ')
        .trim();

      tossups.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

      counter++;
      if (counter % 100 === 0) {
        console.log(counter);
      }
    });

    bonuses.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
      question[field] = question[field]
        .replace(/\t/g, ' ')
        .replace(/ {2,}/g, ' ')
        .trim();

      bonuses.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

      counter++;
      if (counter % 100 === 0) {
        console.log(counter);
      }
    });
  }

  for (const field of arrayFields) {
    console.log('updating', field);
    tossups.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
      for (let i = 0; i < question[field].length; i++) {
        question[field][i] = question[field][i]
          .replace(/\t/g, ' ')
          .replace(/ {2,}/g, ' ')
          .trim();
      }

      tossups.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

      counter++;
      if (counter % 100 === 0) {
        console.log(counter);
      }
    });

    bonuses.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
      for (let i = 0; i < question[field].length; i++) {
        question[field][i] = question[field][i]
          .replace(/\t/g, ' ')
          .replace(/ {2,}/g, ' ')
          .trim();
      }

      bonuses.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

      counter++;
      if (counter % 100 === 0) {
        console.log(counter);
      }
    });
  }
}
