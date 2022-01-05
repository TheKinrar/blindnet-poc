import Blindnet from '@blindnet/sdk-node';
import express from 'express';
import path from 'path';
import url from 'url';
import fs from 'fs';
import http from 'http';
import randomstring from 'randomstring';
import {Server} from 'socket.io';
import config from './config.mjs'

const basedir = path.dirname(url.fileURLToPath(import.meta.url));

const blindnet = await Blindnet.init(config.blindnet.key, config.blindnet.id, 'https://test.blindnet.io');

const app = express();
app.use(express.static(path.join(basedir, 'client')));

app.get('/:id/:file', (req, res) => {
    res.sendFile(path.join(basedir, 'client', 'decrypt.html'));
});

const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    let user_id;
    let upload = false;

    if(socket.handshake.query.id) {
        user_id = socket.handshake.query.id;
    } else {
        user_id = randomstring.generate(32);
        upload = true;
    }

    console.log('Hi ' + user_id);

    blindnet.createUserToken(user_id).then(async (user_token) => {
        if(upload) {
            let temp_token = await blindnet.createTempUserToken([user_id]);

            socket.user_id = user_id;

            socket.on('upload', (data) => {
                fs.writeFileSync(path.join(basedir, 'data', socket.user_id), data);
            });

            socket.emit('user_info', {
                id: user_id,
                token: user_token,
                temp_token
            });
        } else {
            let file = fs.readFileSync(path.join(basedir, 'data', user_id));

            socket.emit('file_info', {
                file,
                token: user_token
            });
        }
    });
});

server.listen(8010);