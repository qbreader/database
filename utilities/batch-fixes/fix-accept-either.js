import { tossups, bonuses } from '../collections.js';

function removeHTML(string) {
    return string
        .replace(/<\/?(b|u|i|em)>/g, '');
}

function unformatString(string) {
    return string
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[\u2018-\u201B]/g, '\'')
        .replace(/[\u201C-\u201F]/g, '"')
        .replace(/[\u2026]/g, '...')
        .replace(/[\u2032-\u2037]/g, '\'')
        .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
        .replace(/\u0142/g, 'l'); // ł -> l
}

function sanitizeString(string) {
    return unformatString(removeHTML(string));
}

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

async function fixAcceptEitherTossups(printFrequency = 10) {
    const total = await tossups.countDocuments({ answer_sanitized: { $regex: /[a-z][A-Z].*[[(]accept either/ } });
    const step = Math.floor(total / printFrequency);
    let counter = 0;

    for (const tossup of await tossups.find({ answer_sanitized: { $regex: /[a-z][A-Z].*[[(]accept either/ } }).toArray()) {
        if (++counter % step === 0) {
            console.log(`${counter} / ${total}`);
        }

        if (tossup.answer.match(/<\/u><\/b><b><u>/)) {
            tossup.answer = tossup.answer.replace(/<\/u><\/b><b><u>/g, '</u></b> <b><u>');
            tossup.answer_sanitized = sanitizeString(tossup.answer);
            await tossups.updateOne(
                { _id: tossup._id },
                { $set: {
                    answer: tossup.answer,
                    answer_sanitized: sanitizeString(tossup.answer),
                } },
            );
        } else {
            const { mainAnswer } = splitMainAnswer(tossup.answer ?? '');

            if (mainAnswer.match(/(?<=<u>)[^<]*(?=<\/u>)/g)?.length !== 1) {
                continue;
            }

            tossup.answer = tossup.answer.replace(/(?<=[a-z])(?=[A-Z])/g, '</u></b> <b><u>');
            tossup.answer_sanitized = tossup.answer_sanitized.replace(/(?<=[a-z])(?=[A-Z])/g, ' ');

            await tossups.updateOne(
                { _id: tossup._id },
                { $set: {
                    answer: tossup.answer,
                    answer_sanitized: sanitizeString(tossup.answer),
                } },
            );
        }
    }
}

async function fixAcceptEitherBonuses(printFrequency = 10) {
    const total = await bonuses.countDocuments({ answers_sanitized: { $regex: /[a-z][A-Z].*[[(]accept either/ } });
    const step = Math.floor(total / printFrequency);
    let counter = 0;

    for (const bonus of await bonuses.find({ answers_sanitized: { $regex: /[a-z][A-Z].*[[(]accept either/ } }).toArray()) {
        if (++counter % step === 0) {
            console.log(`${counter} / ${total}`);
        }

        for (let i = 0; i < bonus.answers.length; i++) {
            if (!bonus.answers_sanitized[i].match(/[a-z][A-Z].*[[(]accept either/)) {
                continue;
            }

            if (bonus.answers[i].match(/<\/u><\/b><b><u>/)) {
                bonus.answers[i] = bonus.answers[i].replace(/<\/u><\/b><b><u>/g, '</u></b> <b><u>');
                bonus.answers_sanitized[i] = sanitizeString(bonus.answers[i]);
                await bonuses.updateOne(
                    { _id: bonus._id },
                    { $set: {
                        [`answers.${i}`]: bonus.answers[i],
                        [`answers_sanitized${i}`]: sanitizeString(bonus.answers[i]),
                    } },
                );
            } else {
                const { mainAnswer } = splitMainAnswer(bonus.answers[i] ?? '');

                if (mainAnswer.match(/(?<=<u>)[^<]*(?=<\/u>)/g)?.length !== 1) {
                    continue;
                }

                bonus.answers[i] = bonus.answers[i].replace(/(?<=[a-z])(?=[A-Z])/g, '</u></b> <b><u>');
                bonus.answers_sanitized[i] = bonus.answers_sanitized[i].replace(/(?<=[a-z])(?=[A-Z])/g, ' ');

                await bonuses.updateOne(
                    { _id: bonus._id },
                    { $set: {
                        [`answers.${i}`]: bonus.answers[i],
                        [`answers_sanitized.${i}`]: sanitizeString(bonus.answers[i]),
                    } },
                );
            }
        }
    }
}

export default async function fixAcceptEither(printFrequency = 10) {
    await fixAcceptEitherTossups(printFrequency);
    await fixAcceptEitherBonuses(printFrequency);
}
