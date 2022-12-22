if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
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
    questions.find({}, { projection: { _id: 1, category: 1, subcategory: 1 } }).forEach(question => {
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
