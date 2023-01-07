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

const reportReasons = [ 'wrong-category', 'answerline-parsing', 'answerline-formatting', 'missing-parts', 'unnecessary-text' ];

function listReports({ bashHighlighting = true, allowedReasons = reportReasons } = {}) {
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
        let hasAllowedReason = false;

        for (const reason of allowedReasons) {
            if (question.reports.map(report => report.reason).includes(reason))
                hasAllowedReason = true;
        }

        if (hasAllowedReason === false) return;

        question.answer = question?.formatted_answer.replace(/<\/?i>/g, '') ?? question.answer;
        question.answer = question.answer
            .replace(/<b>/g, Colors.BOLD)
            .replace(/<u>/g, Colors.UNDERLINE)
            .replace(/<\/b>/g, Colors.ENDC)
            .replace(/<\/u>/g, Colors.ENDC);

        console.log(`${bashHighlighting ? Colors.OKCYAN : ''}${question.setName}${Colors.ENDC} Packet ${question.packetNumber} Question ${question.questionNumber}`);
        console.log(`Question ID: ${bashHighlighting ? Colors.OKBLUE : ''}${question._id}${bashHighlighting ? Colors.ENDC : ''}`);
        console.log(`${question.question}`);
        console.log(`ANSWER: ${question.answer}`);
        console.log(`<${question.category} / ${question.subcategory}>`);
        console.log();

        for (let i = 0; i < question.reports.length; i++) {
            console.log(`${bashHighlighting ? Colors.HEADER : ''}Reason:${bashHighlighting ? Colors.ENDC : ''} ${question.reports[i].reason}`);
            console.log(`${bashHighlighting ? Colors.HEADER : ''}Description:${bashHighlighting ? Colors.ENDC : ''} ${question.reports[i].description}`);
            console.log();
        }
    });
}

// listReports({ allowedReasons: [ 'wrong-category', 'answerline-formatting', 'missing-parts', 'unnecessary-text' ] });
listReports();
