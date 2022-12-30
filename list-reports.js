if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const Colors = require('./Colors');
const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');
});

const database = client.db('qbreader');
const questions = database.collection('questions');

// list all questions that have a report
questions.aggregate([
    { $match: {
        formatted_answer: { $exists: true },
        reports: { $exists: true },
        type: 'tossup',
    } },
    // { $addFields: { report_count: { $size: '$reports' } } },
    // { $sort: { report_count: -1 } },
    { $sort: { reports: -1 } },
]).forEach(async question => {
    question.answer = question?.formatted_answer.replace(/<\/?i>/, 0) ?? question.answer;
    question.answer = question.answer.replace(/<b>/g, Colors.BOLD);
    question.answer = question.answer.replace(/<\/b>/g, Colors.ENDC);
    question.answer = question.answer.replace(/<u>/g, Colors.UNDERLINE);
    question.answer = question.answer.replace(/<\/u>/g, Colors.ENDC);
    console.log(`
${Colors.OKCYAN}${question.setName}${Colors.ENDC} Packet ${question.packetNumber} Question ${question.questionNumber}
Question ID: ${Colors.OKBLUE}${question._id}${Colors.ENDC}
${question.question}
ANSWER: ${question.answer}
<${question.category} / ${question.subcategory}>`);
    for (let i = 0; i < question.reports.length; i++) {
        console.log(`
${Colors.HEADER}Reason:${Colors.ENDC} ${question.reports[i].reason}
${Colors.HEADER}Description:${Colors.ENDC} ${question.reports[i].description}`);
    }
});
