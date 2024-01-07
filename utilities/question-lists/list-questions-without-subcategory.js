import { tossups, bonuses } from '../collections.js';

export default function listQuestionsWithoutSubcategory() {
    tossups.find({ subcategory: { $exists: false } })
        .forEach(question => {
            const { _id } = question;
            const text = question.question + ' ' + question.answer;
            console.log(JSON.stringify({ _id, text, type: 'tossup' }));
        });

    bonuses.find({ subcategory: { $exists: false } })
        .forEach(question => {
            const { _id } = question;
            const text = question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');
            console.log(JSON.stringify({ _id, text, type: 'bonus' }));
        });
}
