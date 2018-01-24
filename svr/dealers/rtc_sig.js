const request = require('request');
const querystring = require('querystring');
const crypto = require('crypto')

const moment = require('moment');
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');

function hash_str(str){
    const md5_hash = crypto.createHash('md5');
    return md5_hash.update(str, 'utf8').digest('hex');
}
let ssms = {};
function sig_rtc(io) {
    let rtc = io.of('/rtc');
    rtc.on('connection', function (socket) {
        console.log('someone connected to rtc space');
        socket.on('ssm_signal', function (data) {
            var super_sock = rtc.connected[data.super_sock_id];
            if (!super_sock) { return; }
            super_sock.emit('ssm_signal', data);
        });
        socket.on('change_ads', function (data) {
            var ssm_sock = rtc.connected[data.ssm_sock_id];
            if (!ssm_sock) { return; }
            console.log('emit change_ads', data)
            ssm_sock.emit('change_ads', data);
        });
        socket.on('send_log', function (data) {
            var ssm_sock = rtc.connected[data.ssm_sock_id];
            if (!ssm_sock) { return; }
            ssm_sock.emit('send_log', data);
        });
        socket.on('super_signal', function (data) {
            var ssm_sock = rtc.connected[data.ssm_sock_id];
            if (!ssm_sock) { return; }
            data.super_sock_id = socket.id;
            ssm_sock.emit('super_signal', data);
        });
        socket.on('I_want_you', function (data) {
            console.log('recieved client I_want_you', data)
            var ssm_sock = rtc.connected[data.ssm_sock_id];
            if (!ssm_sock) { console.log('can not find sock by id='+data.ssm_sock_id); return; }
            data.super_sock_id = socket.id;
            console.log('send I_want_you to client')
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
            sk = hash_str(sk)
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