import { tossups } from '../collections.js';

const removeParentheses = (string) => {
    return string
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '');
};

const splitMainAnswer = (string) => {
    const bracketsSubAnswer = (string.match(/(?<=\[)[^\]]*(?=\])/g) ?? ['']).pop();
    const parenthesesSubAnswer = (string.match(/(?<=\()[^)]*(?=\))/g) ?? ['']).pop();

    const mainAnswer = removeParentheses(string);

    if (bracketsSubAnswer.length !== 0)
        return { mainAnswer, subAnswer: bracketsSubAnswer };

    for (const directive of ['or', 'prompt', 'antiprompt', 'anti-prompt', 'accept', 'reject', 'do not accept']) {
        if (parenthesesSubAnswer.toLowerCase().startsWith(directive))
            return { mainAnswer, subAnswer: parenthesesSubAnswer };
    }

    return { mainAnswer, subAnswer: '' };
};

export default function fixAcceptEither() {
    let count = 0;
    tossups.find({ formatted_answer: { $regex: /[a-z][A-Z].*[[(]accept either/ } }).forEach(async (tossup) => {
        const { mainAnswer, subAnswer } = splitMainAnswer(tossup?.formatted_answer ?? '');
        if (mainAnswer.match(/(?<=<u>)[^<]*(?=<\/u>)/g)?.length === 1) {
            await tossups.updateOne(
                { _id: tossup._id },
                {
                    $set: {
                        formatted_answer: tossup.formatted_answer.replace(/(?<=[a-z])(?=[A-Z])/, '</u></b> <b><u>'),
                        answer: tossup.answer.replace(/(?<=[a-z])(?=[A-Z])/, ' '),
                    },
                },
            );

            count++;
            if (count % 50 === 0)
                console.log(count);
        }
    });
}
