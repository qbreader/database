import 'dotenv/config';

import * as fs from 'fs';
import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    const database = client.db('geoword');
    const packets = database.collection('packets');
    const tossupCollection = database.collection('tossups');

    const PACKET_DIRECTORY = 'packets/';
    fs.readdirSync(PACKET_DIRECTORY).forEach(async packetName => {
        if (packetName.endsWith('.sh') || packetName === '.DS_Store' || !packetName.endsWith('.json')) {
            return;
        }

        const divisions = [];

        fs.readdirSync(PACKET_DIRECTORY + packetName).forEach(async fileName => {
            if (!fileName.endsWith('.json')) {
                return;
            }

            const division = fileName.slice(0, -5);
            console.assert(['High School', 'Division 1', 'Division 2'].includes(division), 'wrong division');

            const data = JSON.parse(fs.readFileSync(PACKET_DIRECTORY + packetName + '/' + fileName));
            const { tossups } = data;

            packetName = packetName.slice(0, -5);
            divisions.push(division);

            await tossupCollection.deleteMany({ packetName, division: fileName });

            for (let index = 0; index < tossups.length; index++) {
                const tossup = tossups[index];

                tossup.question = tossup.question.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
                tossup.answer = tossup.answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();

                if (tossup.formatted_answer) {
                    tossup.formatted_answer = tossup.formatted_answer.replace(/\t/g, ' ').replace(/ {2,}/g, ' ').trim();
                }

                tossup.division = tossup.division || fileName;
                tossup.packetName = packetName;
                tossup.questionNumber = tossup.questionNumber || (index + 1);
            }

            console.log(await tossupCollection.insertMany(tossups));
        });

        console.log(await packets.insertOne({ name: packetName, divisions }));
    });
});
