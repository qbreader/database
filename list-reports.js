if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const bcolors = require('./bcolors');
const { tossupToString, bonusToString } = require('./stringify');

const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');
});

const database = client.db('qbreader');
const questions = database.collection('questions');

const reportReasons = [ 'wrong-category', 'answerline-parsing', 'answerline-formatting', 'missing-parts', 'unnecessary-text' ];

function listReports({ bashHighlighting = true, allowedReasons = reportReasons, questionTypes = ['tossup', 'bonus'] } = {}) {
    questions.aggregate([
        { $match: {
            $or: [{ formatted_answer: { $exists: true } }, { formatted_answers: { $exists: true } }],
            reports: { $exists: true },
            type: { $in: questionTypes },
        } },
        { $sort: { setName: 1, reports: 1 } },
    ]).forEach(async question => {
        let hasAllowedReason = false;

        for (const reason of allowedReasons) {
            if (question.reports.map(report => report.reason).includes(reason))
                hasAllowedReason = true;
        }

        if (!hasAllowedReason)
            return;

        if (question.type === 'tossup') {
            console.log(tossupToString(question, bashHighlighting));
        } else {
            console.log(bonusToString(question, bashHighlighting));
        }

        for (let i = 0; i < question.reports.length; i++) {
            console.log(`${bashHighlighting ? bcolors.HEADER : ''}Reason:${bashHighlighting ? bcolors.ENDC : ''} ${question.reports[i].reason}`);
            console.log(`${bashHighlighting ? bcolors.HEADER : ''}Description:${bashHighlighting ? bcolors.ENDC : ''} ${question.reports[i].description}`);
            console.log();
        }
    });
}

listReports({ allowedReasons: [ 'wrong-category', 'answerline-formatting', 'missing-parts', 'unnecessary-text' ] });
// listReports();
