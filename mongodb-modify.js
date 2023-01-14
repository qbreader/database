if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const database = client.db('qbreader');
const questions = database.collection('questions');
const sets = database.collection('sets');


function clearReports() {
    questions.updateMany({ reports: { $exists: true } }, { $unset: { reports: '' } }).then(result => {
        console.log(result);
    });
}


async function deleteSet(setName) {
    const set = await sets.findOne({ name: setName });
    sets.deleteOne({ name: setName });
    console.log(await questions.deleteMany({ set: set._id }));
}


function denormalizeSetNames() {
    let counter = 0;
    sets.find({}).forEach(set => {
        counter++;
        if (counter % 10 === 0) {
            console.log(`${counter} ${set.name}`);
        }

        questions.updateMany({
            set: set._id
        }, { $set: { setName: set.name, updatedAt: new Date() } });
    });
}


function fixPacketOrders() {
    sets.find({}).forEach(set => {
        const correctPackets = [];
        let hasSwap = false;

        for (let i = 0; i < set.packets.length; i++) {
            for (let j = 0; j < set.packets.length; j++) {
                if (parseInt(set.packets[j].name) === i + 1) {
                // if (String(set.packets[j].name).search(new RegExp(`\\b${i + 1}\\b`)) >= 0) {
                    correctPackets.push(set.packets[j]);
                    if (i !== j) hasSwap = true;
                    break;
                }
            }
        }

        if (hasSwap && correctPackets.length === set.packets.length) {
            console.log(set.name);
            console.log(set.packets.map(packet => packet.name));
            console.log(correctPackets.map(packet => packet.name));

            sets.updateOne({ _id: set._id }, { $set: { packets: correctPackets } });
            for (let i = 0; i < set.packets.length; i++) {
                questions.updateMany({ packet: correctPackets[i]._id }, { $set: { packetNumber: i + 1 } });
            }
        }
    });
}


function listQuestionsWithoutSubcategory() {
    questions.find({ subcategory: { $exists: false } })
        .forEach(question => {
            const { _id, type } = question;
            const text = type === 'tossup'
                ? question.question + ' ' + question.answer
                : question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');

            console.log(JSON.stringify({ _id, text }));
        });
}


function listSetsWithAnswerFormatting() {
    questions.aggregate([
        {
            $match: { $or: [{ formatted_answer: { $exists: true } }, { formatted_answers: { $exists: true } }] }
        },
        {
            $group: { _id: '$set' }
        }
    ]).forEach(async set => {
        console.log((await sets.findOne({ _id: set._id }, { projection: { _id: 0, name: 1 } })).name);
    });
}


function listSetsWithoutDifficulty() {
    sets.find({ difficulty: { $exists: false } }).forEach(set => {
        console.log(set.name);
    });
}


async function listSetsWithoutCategories() {
    let sets = await questions.aggregate([
        { $match: { category: { $exists: false } } },
        { $group: { _id: '$setName' } }
    ]).toArray();
    sets = sets.map(set => set._id);
    sets.sort();
    console.log(sets);
}


async function renameSet(oldName, newName) {
    const set = await sets.findOneAndUpdate({ name: oldName }, { $set: { name: newName } }).then(result => result.value);
    console.log(set._id);
    questions.updateMany({ set: set._id }, { $set: { setName: newName, updatedAt: new Date() } }).then(result => {
        console.log(result);
    });
}


function standardizeSubcategories() {
    const cats = require('./subcat-to-cat.json');
    const subcats = require('./standardize-subcats.json');

    let counter = 0;
    questions.find({ subcategory: { $nin: Object.keys(cats) } }, { projection: { _id: 1, category: 1, subcategory: 1 } }).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) return;

        if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            questions.updateOne({ _id: question._id }, { $set: { category: cats[question.subcategory], subcategory: question.subcategory } });
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
        }
    });
}


function updateQuestionCategory(_id, subcategory) {
    const cats = require('./subcat-to-cat.json');

    questions.updateOne({ _id: ObjectId(_id) }, {
        $set: { category: cats[subcategory], subcategory: subcategory },
        $unset: { reports: '' }
    }).then(result => {
        console.log(result);
    });
}


function updateSetDifficulty(setName, difficulty) {
    sets.updateOne({ name: setName }, { $set: { difficulty: difficulty } });

    sets.find({ name: setName }).forEach(set => {
        questions.updateMany(
            { set: set._id },
            { $set: { difficulty: difficulty, updatedAt: new Date() } },
            (err, result) => {
                if (err) console.log(err);

                console.log(`Updated ${set.name} difficulty to ${difficulty}`);
            });
    });
}

/**
 * Each line of the file at `filename` should be a valid JSON object with a `_id`, `category`, and `subcategory` field.
 * This function updates each document located at `_id` with the corresponding `category` and `subcategory`.
 * @param {String} filename the file from which to read in data for the categories
 */
async function updateQuestionsWithoutSubcategory(filename) {
    const fs = require('fs');
    const data = fs.readFileSync(filename, { encoding: 'utf-8' });

    let counter = 0;

    for (const line of data.split('\n')) {
        if (line === '')
            continue;

        const data = JSON.parse(line);
        const result = await questions.updateOne({ _id: new ObjectId(data._id) }, { $set: { category: data.category, subcategory: data.subcategory } });
        counter++;

        if (counter % 100 == 0) {
            console.log(counter);
            console.log(result);
        }
    }
}
