if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
    client.close();
});

const database = client.db('qbreader');
const sets = database.collection('sets');
const tossups = database.collection('tossups');
const bonuses = database.collection('bonuses');


const cats = require('./subcat-to-cat.json');


function clearReports() {
    tossups.updateMany({ reports: { $exists: true } }, { $unset: { reports: '' } }).then(result => {
        console.log(result);
    });

    bonuses.updateMany({ reports: { $exists: true } }, { $unset: { reports: '' } }).then(result => {
        console.log(result);
    });
}


async function deleteSet(setName) {
    const set = await sets.findOne({ name: setName });
    sets.deleteOne({ name: setName });
    console.log(await tossups.deleteMany({ set: set._id }));
    console.log(await bonuses.deleteMany({ set: set._id }));
}


function denormalizeSetNames() {
    let counter = 0;
    sets.find({}).forEach(set => {
        counter++;
        if (counter % 10 === 0) {
            console.log(`${counter} ${set.name}`);
        }

        tossups.updateMany({
            set: set._id
        }, { $set: { setName: set.name, updatedAt: new Date() } });
        bonuses.updateMany({
            set: set._id
        }, { $set: { setName: set.name, updatedAt: new Date() } });
    });
}


function denormalizeSetYears() {
    let counter = 0;
    sets.find({}).forEach(set => {
        const setYear = parseInt(set.name.slice(0, 4));

        sets.updateOne({ _id: set._id }, { $set: { year: setYear } });

        tossups.updateMany(
            { set: set._id },
            { $set: { setYear: setYear, updatedAt: new Date() } }
        );

        bonuses.updateMany(
            { set: set._id },
            { $set: { setYear: setYear, updatedAt: new Date() } }
        );

        counter++;
        if (counter % 20 === 0) {
            console.log(`${counter} - (${setYear}) - ${set.name}`);
        }
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
                tossups.updateMany({ packet: correctPackets[i]._id }, { $set: { packetNumber: i + 1 } });
                bonuses.updateMany({ packet: correctPackets[i]._id }, { $set: { packetNumber: i + 1 } });
            }
        }
    });
}


async function fixSpaces() {
    const fields = ['question', 'answer', 'formatted_answer', 'leadin'];
    const arrayFields = ['parts', 'answers', 'formatted_answers'];

    for (const field of fields) {
        console.log(field, await tossups.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
        console.log(field, await bonuses.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
    }

    for (const field of arrayFields) {
        console.log(field, await tossups.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
        console.log(field, await bonuses.countDocuments({ [field]: /\t|^ | $| {2,}/ }));
    }

    let counter = 0;

    for (const field of fields) {
        console.log('updating', field);
        tossups.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            question[field] = question[field]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();

            tossups.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });

        bonuses.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            question[field] = question[field]
                .replace(/\t/g, ' ')
                .replace(/ {2,}/g, ' ')
                .trim();

            bonuses.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });
    }

    for (const field of arrayFields) {
        console.log('updating', field);
        tossups.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            for (let i = 0; i < question[field].length; i++) {
                question[field][i] = question[field][i]
                    .replace(/\t/g, ' ')
                    .replace(/ {2,}/g, ' ')
                    .trim();
            }

            tossups.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });

        bonuses.find({ [field]: /\t|^ | $| {2,}/ }).forEach(question => {
            for (let i = 0; i < question[field].length; i++) {
                question[field][i] = question[field][i]
                    .replace(/\t/g, ' ')
                    .replace(/ {2,}/g, ' ')
                    .trim();
            }

            bonuses.updateOne({ _id: question._id }, { $set: { [field]: question[field] } });

            counter++;
            if (counter % 100 === 0) {
                console.log(counter);
            }
        });
    }
}


async function listAlternateSubcategories(update = false) {
    tossups.find({
        subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] }
    }).forEach(question => {
        const { _id } = question;
        const text = question.question + ' ' + question.answer;
        console.log(JSON.stringify({ _id, text }));
    });

    if (update) {
        console.log(await tossups.updateMany(
            { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
            { $rename: { subcategory: 'alternate_subcategory' } }
        ));
    }

    bonuses.find({
        subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] }
    }).forEach(question => {
        const { _id } = question;
        const text = question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');
        console.log(JSON.stringify({ _id, text }));
    });

    if (update) {
        console.log(await bonuses.updateMany(
            { subcategory: { $in: ['Poetry', 'Drama', 'Long Fiction', 'Short Fiction'] } },
            { $rename: { subcategory: 'alternate_subcategory' } }
        ));
    }
}


function listQuestionsWithoutSubcategory() {
    tossups.find({ subcategory: { $exists: false } })
        .forEach(question => {
            const { _id } = question;
            const text = question.question + ' ' + question.answer;
            console.log(JSON.stringify({ _id, text }));
        });

    bonuses.find({ subcategory: { $exists: false } })
        .forEach(question => {
            const { _id } = question;
            const text = question.leadin + question.parts.reduce((a, b) => a + ' ' + b, '') + question.answers.reduce((a, b) => a + ' ' + b, '');
            console.log(JSON.stringify({ _id, text }));
        });
}


function listSetsWithAnswerFormatting() {
    tossups.aggregate([
        { $match: { formatted_answer: { $exists: true } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });

    bonuses.aggregate([
        { $match: { formatted_answers: { $exists: true } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });
}


function listSetsWithoutField(field) {
    tossups.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });

    bonuses.aggregate([
        { $match: { [field]: { $exists: false } } },
        { $group: { _id: '$setName' } }
    ]).forEach(set => {
        console.log(set._id);
    });
}


async function renameSet(oldName, newName) {
    const set = await sets.findOneAndUpdate({ name: oldName }, { $set: { name: newName } }).then(result => result.value);
    console.log(set._id);

    tossups.updateMany(
        { set: set._id },
        { $set: { setName: newName, updatedAt: new Date() } }
    ).then(result => {
        console.log(result);
    });

    bonuses.updateMany(
        { set: set._id },
        { $set: { setName: newName, updatedAt: new Date() } }
    ).then(result => {
        console.log(result);
    });
}


async function sanitizeLeadin() {
    const count = await bonuses.countDocuments({ leadin: { $regex: /\[(10)?[EMH]\].*ANSWER:/i } });
    console.log(count);

    let counter = 0;

    bonuses.find({ leadin: { $regex: /\[(10)?[EMH]\].*ANSWER:/i } }).forEach(question => {
        bonuses.updateOne(
            { _id: question._id },
            { $set: { leadin: question.leadin.replace(/\[(10)?[EMH]\].*ANSWER:/i, '').trim(), updatedAt: new Date() } }
        );

        counter++;
        if (counter % 100 === 0) {
            console.log(counter);
        }
    });

    return counter;
}


function standardizeSubcategories() {
    const subcats = require('./standardize-subcats.json');

    let counter = 0;

    tossups.find(
        { subcategory: { $nin: Object.keys(cats) } },
        { projection: { _id: 1, category: 1, subcategory: 1 } },
    ).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) return;

        if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            updateOneSubcategory(question._id, question.subcategory, false);
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
        }
    });

    bonuses.find(
        { subcategory: { $nin: Object.keys(cats) } },
        { projection: { _id: 1, category: 1, subcategory: 1 } },
    ).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) return;

        if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            updateOneSubcategory(question._id, question.subcategory, false);
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
        }
    });
}


async function updateOneSubcategory(_id, subcategory, type, clearReports = true) {
    if (!(subcategory in cats)) {
        console.log(`Subcategory ${subcategory} not found`);
        return;
    }

    const updateDoc = { $set: { category: cats[subcategory], subcategory: subcategory, updatedAt: new Date() } };

    if (clearReports)
        updateDoc['$unset'] = { reports: 1 };

    if (type === 'tossup') {
        return await tossups.updateOne({ _id: ObjectId(_id) }, updateDoc);
    }

    if (type === 'bonus') {
        return await bonuses.updateOne({ _id: ObjectId(_id) }, updateDoc);
    }
}


/**
 * Each line of the file at `filename` should be a valid JSON object with a `_id`, `type`, `category`, and `subcategory` field.
 * This function updates each document located at `_id` with the corresponding `category` and `subcategory`.
 * @param {String} filename the file from which to read in data for the categories
 */
async function updateManySubcategories(filename) {
    const fs = require('fs');
    const data = fs.readFileSync(filename, { encoding: 'utf-8' });

    let counter = 0;

    for (const line of data.split('\n')) {
        if (line === '')
            continue;

        const { _id, subcategory, type } = JSON.parse(line);
        const result = await updateOneSubcategory(_id, subcategory, type, false);

        counter++;
        if (counter % 100 == 0) {
            console.log(counter);
            console.log(result);
        }
    }
}


async function updateSetDifficulty(setName, difficulty) {
    sets.updateOne({ name: setName }, { $set: { difficulty: difficulty } });

    const set = await sets.findOne({ name: setName });

    tossups.updateMany(
        { set: set._id },
        { $set: { difficulty: difficulty, updatedAt: new Date() } },
        (err, _result) => {
            if (err)
                console.log(err);

            console.log(`Updated ${set.name} difficulty to ${difficulty}`);
        });

    bonuses.updateMany(
        { set: set._id },
        { $set: { difficulty: difficulty, updatedAt: new Date() } },
        (err, _result) => {
            if (err)
                console.log(err);

            console.log(`Updated ${set.name} difficulty to ${difficulty}`);
        });
}
