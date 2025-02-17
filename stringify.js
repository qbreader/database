import * as bcolors from './bcolors.js';

function tossupToString (question, bashHighlighting = true) {
  let string = '';

  string += `${bashHighlighting ? bcolors.OKCYAN : ''}${question.set.name}${bcolors.ENDC} Packet ${question.packet.number} Question ${question.number}\n`;
  string += `Question ID: ${bashHighlighting ? bcolors.OKBLUE : ''}${question._id}${bashHighlighting ? bcolors.ENDC : ''}\n`;

  question.answer = question.answer
    .replace(/<b>/g, bashHighlighting ? bcolors.BOLD : '')
    .replace(/<u>/g, bashHighlighting ? bcolors.UNDERLINE : '')
    .replace(/<\/b>/g, bashHighlighting ? bcolors.ENDC : '')
    .replace(/<\/u>/g, bashHighlighting ? bcolors.ENDC : '')
    .replace(/<\/?i>/g, '');

  string += `${question.question}\n`;
  string += `ANSWER: ${question.answer}\n`;
  string += `<${question.category} / ${question.subcategory}>\n`;

  return string;
}

function bonusToString (question, bashHighlighting = true) {
  let string = '';

  string += `${bashHighlighting ? bcolors.OKCYAN : ''}${question.set.name}${bcolors.ENDC} Packet ${question.packet.number} Question ${question.number}\n`;
  string += `Question ID: ${bashHighlighting ? bcolors.OKBLUE : ''}${question._id}${bashHighlighting ? bcolors.ENDC : ''}\n`;

  for (let i = 0; i < question.answers.length; i++) {
    question.answers[i] = question.answers[i]
      .replace(/<b>/g, bashHighlighting ? bcolors.BOLD : '')
      .replace(/<u>/g, bashHighlighting ? bcolors.UNDERLINE : '')
      .replace(/<\/b>/g, bashHighlighting ? bcolors.ENDC : '')
      .replace(/<\/u>/g, bashHighlighting ? bcolors.ENDC : '')
      .replace(/<\/?i>/g, '');
  }

  string += `${question.leadin}\n`;
  for (let i = 0; i < question.answers.length; i++) {
    string += `[10] ${question.parts[i]}\n`;
    string += `ANSWER: ${question.answers[i]}\n`;
  }
  string += `<${question.category} / ${question.subcategory}>\n`;

  return string;
}

export { bonusToString, tossupToString };
