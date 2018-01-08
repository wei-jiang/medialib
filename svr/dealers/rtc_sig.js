const request = require('request');
const querystring = require('querystring');
const crypto = require('crypto')
const moment = require('moment');
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');

let ssms = {};
function sig_rtc(io) {
    let rtc = io.of('/rtc');
    rtc.on('connection', function (socket) {
        console.log('someone connected to rtc space');
        socket.on('ssm_signal', function (data) {
            var super_sock = io.sockets.connected[data.super_sock_id];
            if (!super_sock) { return; }
            super_sock.emit('ssm_signal', data);
        });
        socket.on('send_log', function (data) {
            var ssm_sock = io.sockets.connected[data.ssm_sock_id];
            if (!ssm_sock) { return; }
            ssm_sock.emit('send_log', data);
        });
        socket.on('super_signal', function (data) {
            var ssm_sock = io.sockets.connected[data.ssm_sock_id];
            if (!ssm_sock) { return; }
            data.super_sock_id = socket.id;
            ssm_sock.emit('super_signal', data);
        });
        socket.on('I_want_you', function (data) {
            var ssm_sock = io.sockets.connected[data.ssm_sock_id];
            if (!ssm_sock) { return; }
            data.super_sock_id = socket.id;
            ssm_sock.emit('I_want_you', data);
        });
        socket.on('supervisor_online', function (data) {
            socket.join('supervisor');
            socket.emit('ssms_all_yours', ssms);
            // console.log(ssms);
        });
        socket.on('ssm_online', function (data) {
            if (!data) return;
            socket.join('ssm');
            data.ssm_sock_id = socket.id;
            let sk = data.my_ip + data.dev_id;
            let hash = crypto.createHash('md5');
            sk = hash.update(sk, 'utf8').digest('hex');
            data.ssm_hash = sk;
            ssms[sk] = data;
            // console.log(data);
            console.log( _.values(ssms) )
            socket.to('supervisor').emit('ssms_all_yours', _.values(ssms) );
            socket.on('disconnect', () => {
                delete ssms[sk];
                socket.to('supervisor').emit('ssms_all_yours', _.values(ssms) );
            });
        });
    });

}

module.exports = sig_rtc;