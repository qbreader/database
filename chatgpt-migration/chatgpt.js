import 'dotenv/config';

import { categories, alternate_subcategories, subsubcategories, SUBCATEGORY_TO_CATEGORY } from './constants.js';

import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        },
    );
}

async function classifyCategory(text, categories) {
    categories = categories.map(category => `"${category}"`).join(', ');
    const content = `Classify the following text as one of ${categories}. Your response should consist of one of the categories and nothing else. ${text}`;

    const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: content }],
        stream: false,
        n: 1,
    });

    const category = toTitleCase(stream.choices[0].message.content.split('\n')[0].trim().replace(/[.'"]/g, ''));

    return category;
}


async function classify(text) {
    const subcategory = await classifyCategory(text, Object.keys(SUBCATEGORY_TO_CATEGORY));
    const category = SUBCATEGORY_TO_CATEGORY[subcategory];
    let alternate_subcategory = undefined;

    if (subsubcategories[subcategory]) {
        alternate_subcategory = await classifyCategory(text, subsubcategories[subcategory]);
        if (!subsubcategories[subcategory].includes(alternate_subcategory)) {
            throw new Error(`Invalid subsubcategory ${alternate_subcategory} for subcategory ${subcategory}`);
        }
        return { category, subcategory, alternate_subcategory };
    }

    if (alternate_subcategories[category]) {
        alternate_subcategory = await classifyCategory(text, alternate_subcategories[category]);
        if (!alternate_subcategories[category].includes(alternate_subcategory)) {
            throw new Error(`Invalid alternate subcategory ${alternate_subcategory} for category ${category}`);
        }
        return { category, subcategory, alternate_subcategory };
    }

    return { category, subcategory };
}

for (const [filename, lines] of [
    ['output-tossup.txt', readFileSync('tossup-log.txt', 'utf-8').split('\n')],
    ['output-bonus.txt', readFileSync('bonus-log.txt', 'utf-8').split('\n')],
]) {
    for (const line of lines) {
        try {
            const { _id, text } = JSON.parse(line);
            const classification = await classify(text);
            classification._id = _id;
            writeFileSync(filename, JSON.stringify(classification) + '\n', { flag: 'a' });
        } catch (e) {
            console.error(e);
            continue;
        }
    }
}
