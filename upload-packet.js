if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');


const data = JSON.parse(fs.readFileSync('17.json'));
const setID = new ObjectId('62e35effc080082733afc3cc');
const packetID = new ObjectId('62e35effc080082733afc699');
const setName = '2012 Chicago Open';
const packetNumber = 17;

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');

    const database = client.db('qbreader');
    const sets = database.collection('sets');
    const questions = database.collection('questions');

    questions.deleteMany({ set: setID, packet: packetID }).then(result => {
        console.log(result);
    });

    const tossups = [];
    const bonuses = [];

    data.tossups.forEach((tossup, index) => {
        tossup.question = tossup.question
            .replace(/\t/g, ' ')
            .replace(/ {2,}/g, ' ')
            .trim();

        tossup.answer = tossup.answer
            .replace(/\t/g, ' ')
            .replace(/ {2,}/g, ' ')
            .trim();

        if (tossup.formatted_answer) {
            tossup.formatted_answer = tossup.formatted_answer
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        tossup._id = new ObjectId();
        tossup.packet = packetID;
        tossup.set = setID;
        tossup.setName = setName;
        tossup.type = 'tossup';
        tossup.packetNumber = packetNumber;
        tossup.questionNumber = tossup.questionNumber || (index + 1);
        tossup.createdAt = tossup.createdAt || new Date();
        tossup.updatedAt = tossup.updatedAt || new Date();
        questions.insertOne(tossup);
        tossups.push(tossup._id);
    });

    data.bonuses.forEach((bonus, index) => {
        delete bonus.values;

        for (let i = 0; i < bonus.parts.length; i++) {
            bonus.parts[i] = bonus.parts[i]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        for (let i = 0; i < bonus.answers.length; i++) {
            bonus.answers[i] = bonus.answers[i]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        for (let i = 0; i < bonus?.formatted_answers.length ?? 0; i++) {
            bonus.formatted_answers[i] = bonus.formatted_answers[i]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();
        }

        bonus._id = new ObjectId();
        bonus.packet = packetID;
        bonus.set = setID;
        bonus.setName = setName;
        bonus.type = 'bonus';
        bonus.packetNumber = packetNumber;
        bonus.questionNumber = bonus.questionNumber || (index + 1);
        bonus.createdAt = bonus.createdAt || new Date();
        bonus.updatedAt = bonus.updatedAt || new Date();
        questions.insertOne(bonus);
        bonuses.push(bonus._id);
    });

    sets.updateOne(
        { _id: setID },
        { $set: {
            ['packets.' + packetNumber + '.tossups']: tossups,
            ['packets.' + packetNumber + '.bonuses']: bonuses,
        } }
    ).then(result => {
        console.log(result);
    });
});
