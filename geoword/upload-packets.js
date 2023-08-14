import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    const database = client.db('geoword');
    const packets = database.collection('packets');
    const tossupCollection = database.collection('tossups');

    const PACKET_DIRECTORY = 'packets/';
    fs.readdirSync(PACKET_DIRECTORY).forEach(async packetName => {
        if (packetName.endsWith('.sh') || packetName === '.DS_Store') {
            return;
        }

        console.log('Uploading', packetName);

        const divisions = [];
        const packet_id = new ObjectId();

        fs.readdirSync(PACKET_DIRECTORY + packetName).forEach(async fileName => {
            if (!fileName.endsWith('.json')) {
                return;
            }

            const division = fileName.slice(0, -5);

            if (!['High School', 'Division 1', 'Division 2'].includes(division)) {
                console.log('wrong division:', division);
                return;
            }

            const data = JSON.parse(fs.readFileSync(PACKET_DIRECTORY + packetName + '/' + fileName));
            const { tossups } = data;

            divisions.push(division);

            await tossupCollection.deleteMany({ packetName, division: fileName });

            for (let index = 0; index < tossups.length; index++) {
                const tossup = tossups[index];

                tossup.question = tossup.question.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
                tossup.answer = tossup.answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();

                if (tossup.formatted_answer) {
                    tossup.formatted_answer = tossup.formatted_answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
                }

                tossup.division = tossup.division || division;
                tossup.packetName = packetName;
                tossup.packet_id = packet_id;
                tossup.questionNumber = tossup.questionNumber || (index + 1);
            }

            console.log(await tossupCollection.insertMany(tossups));
        });

        console.log(await packets.replaceOne({ name: packetName, divisions }, { _id: packet_id, name: packetName, divisions, test: true, active: false }, { upsert: true }));
    });
});
