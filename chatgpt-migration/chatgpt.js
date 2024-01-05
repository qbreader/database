import 'dotenv/config';

import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function classifyAlternateSubcategory(text, categories) {
    categories = categories.map(category => `"${category}"`).join(', ');
    const content = `Classify the following text as one of ${categories}. Your response should consist of one of the categories and nothing else. ${text}`;

    const stream = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo-1106',
        messages: [{ role: 'user', content: content }],
        stream: false,
        n: 1,
    });

    const category = stream.choices[0].message.content;

    return category;
}

const categories = [
    'Math',
    'Astronomy',
    'Computer Science',
    'Earth Science',
    'Engineering',
    'Other',
];

const lines = readFileSync('tossups.txt', 'utf-8').split('\n');
// const lines = readFileSync('bonuses.txt', 'utf-8').split('\n');

for (const line of lines) {
    const { _id, text } = JSON.parse(line);
    const category = await classifyAlternateSubcategory(text, categories);
    writeFileSync('output-tossups-ss.txt', JSON.stringify({ _id: _id, alternate_subcategory: category }) + '\n', { flag: 'a' });
}
