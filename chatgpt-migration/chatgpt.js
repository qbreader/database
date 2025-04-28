import 'dotenv/config';

import { CATEGORY_TO_ALTERNATE_SUBCATEGORY, SUBCATEGORY_TO_SUBSUBCATEGORY, SUBCATEGORY_TO_CATEGORY, SUBCATEGORIES } from './constants.js';

import { readFileSync, writeFileSync } from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function toTitleCase (str) {
  return str.replace(
    /\w\S*/g,
    function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

/**
 * Classifies a given text into one of the specified categories using OpenAI's GPT model.
 *
 * @function classifyCategory
 * @param {string} text - The text to be classified.
 * @param {string[]} categories - An array of category names to classify the text into.
 * @returns {Promise<string>} A promise that resolves to the classified category.
 * @throws {Error} Throws an error if the classified category is not one of the provided categories.
 */
async function classifyCategory (text, categories) {
  categories = categories.map(category => `"${category}"`).join(', ');
  const content = `Classify the following text as one of ${categories}. Your response should consist of one of the categories and nothing else. ${text}`;

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content }],
    stream: false,
    n: 1
  });

  const category = toTitleCase(stream.choices[0].message.content.split('\n')[0].trim().replace(/[.'"]/g, ''));
  if (!categories.includes(category)) {
    throw new Error(`Invalid category ${category} for categories ${categories}`);
  }
  return category;
}

async function classify (text) {
  const subcategory = await classifyCategory(text, SUBCATEGORIES);
  const category = SUBCATEGORY_TO_CATEGORY[subcategory];

  if (SUBCATEGORY_TO_SUBSUBCATEGORY[subcategory]) {
    const alternateSubcategory = await classifyCategory(text, SUBCATEGORY_TO_SUBSUBCATEGORY[subcategory]);
    return { category, subcategory, alternate_subcategory: alternateSubcategory };
  }

  if (CATEGORY_TO_ALTERNATE_SUBCATEGORY[category]) {
    const alternateSubcategory = await classifyCategory(text, CATEGORY_TO_ALTERNATE_SUBCATEGORY[category]);
    return { category, subcategory, alternate_subcategory: alternateSubcategory };
  }

  return { category, subcategory };
}

for (const [filename, lines] of [
  ['output-tossup.txt', readFileSync('tossup-log.txt', 'utf-8').split('\n')],
  ['output-bonus.txt', readFileSync('bonus-log.txt', 'utf-8').split('\n')]
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
  console.log(`Finished processing ${filename} with ${lines.length} lines`);
}
