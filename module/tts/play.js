
require('dotenv').config();
const db = require('quick.db');
const MDB = require('../../MDB/data');
const { writeFileSync } = require('fs');
const timer = require('./timer');

const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const ttsclient = new TextToSpeechClient({
    keyFile: 'googlettsapi.json',
    fallback: false,
});

module.exports = {
    play,
    broadcast,
};

// TEXT -> tts.WAV로 변경
async function play(message = new Message, sdb = MDB.object.server, channel = new Channel, text = String, options = Object) {
    const response = await ttsclient.synthesizeSpeech({
        input: {text: text},
        voice: {
            languageCode: 'ko-KR',
            name: 'ko-KR-Standard-A'
        },
        audioConfig: {
            audioEncoding: 'MP3', // 형식
            speakingRate: 0.905, // 속도
            pitch: 0, // 피치
            // sampleRateHertz: 16000, // 헤르츠
            // effectsProfileId: ['medium-bluetooth-speaker-class-device'] // 효과 https://cloud.google.com/text-to-speech/docs/audio-profiles
        },
    });
    options['volume'] = 0.7;

    var fileurl = `${message.guild.id}.wav`;
    writeFileSync(fileurl, response[0].audioContent, {encoding: 'utf8'});
    return await broadcast(message, sdb, channel, fileurl, options);
}
// TEXT -> tts.WAV로 변경 끝

// 출력
async function broadcast(message = new Message, sdb = Object, channel = new Channel, url = String, options = Object) {
    return channel.join().then(connection => {
        timer.set(message, sdb, true);
        const dispatcher = connection.play(url, options);
        var timerstart = db.get(`db.${message.guild.id}.tts.timerstart`);
        if (!timerstart) {
            db.set(`db.${message.guild.id}.tts.timerstart`, true);
            timer.play(message, sdb);
        }
    });
}
// 출력 끝
