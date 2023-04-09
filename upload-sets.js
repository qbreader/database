if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');

    const database = client.db('qbreader');
    const sets = database.collection('sets');
    const tossups = database.collection('tossups');
    const bonuses = database.collection('bonuses');

    const PACKET_DIRECTORY = 'packets/';
    fs.readdirSync(PACKET_DIRECTORY).forEach(async setName => {
        let packetNumber = 0;
        if (setName.endsWith('.sh') || setName === '.DS_Store') return;

        if (await sets.findOne({ name: setName })) {
            console.log(`${setName} already exists`);
            return;
        }

        const setYear = parseInt(setName.slice(0, 4));
        const set = { _id: new ObjectId(), name: setName, year: setYear, packets: [] };

        console.log(`Uploading ${setName}...`);

        fs.readdirSync(PACKET_DIRECTORY + setName).sort().forEach((packetName) => {
            if (!packetName.endsWith('.json')) return;

            // console.log(packetName);
            packetNumber++;
            const packet = { _id: new ObjectId(), name: packetName.slice(0, -5), tossups: [], bonuses: [] };
            const data = JSON.parse(fs.readFileSync(PACKET_DIRECTORY + setName + '/' + packetName));

            if (data.tossups) {
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
                    tossup.packet = packet._id;
                    tossup.set = set._id;
                    tossup.setName = setName;
                    tossup.setYear = setYear;
                    tossup.type = 'tossup';
                    tossup.packetNumber = packetNumber;
                    tossup.packetName = packetName.slice(0, -5);
                    tossup.questionNumber = tossup.questionNumber || (index + 1);
                    tossup.createdAt = tossup.createdAt || new Date();
                    tossup.updatedAt = tossup.updatedAt || new Date();
                    tossups.insertOne(tossup);
                    packet.tossups.push(tossup._id);
                });
            } else {
                console.log('no tossups for ' + setName + '/' + packetName);
            }

            if (data.bonuses) {
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
                    bonus.packet = packet._id;
                    bonus.set = set._id;
                    bonus.setName = setName;
                    bonus.setYear = setYear;
                    bonus.type = 'bonus';
                    bonus.packetNumber = packetNumber;
                    bonus.packetName = packetName.slice(0, -5);
                    bonus.questionNumber = bonus.questionNumber || (index + 1);
                    bonus.createdAt = bonus.createdAt || new Date();
                    bonus.updatedAt = bonus.updatedAt || new Date();
                    bonuses.insertOne(bonus);
                    packet.bonuses.push(bonus._id);
                });
            } else {
                console.log('no bonuses for ' + setName + '/' + packetName);
            }
            set.packets.push(packet);
        });

        sets.insertOne(set, (err, result) => {
            if (err) console.log(err);
            console.log(setName + ' inserted');
        });
    });
});
