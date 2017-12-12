const request = require('request');
const querystring = require('querystring');
const moment = require('moment');
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');

let ssms = {};
function sig_rtc(io) {
    let rtc = io.of('/rtc');
    // console.log('hello! ', rtc.decoded_token);
    rtc.on('ssm_signal', function (data) {
        var super_sock = io.sockets.connected[data.super_sock_id];
        if (!super_sock) { return; }
        super_sock.emit('ssm_signal', data);
    });
    rtc.on('send_log', function (data) {
        var ssm_sock = io.sockets.connected[data.ssm_sock_id];
        if (!ssm_sock) { return; }
        ssm_sock.emit('send_log', data);
    });
    rtc.on('super_signal', function (data) {
        var ssm_sock = io.sockets.connected[data.ssm_sock_id];
        if (!ssm_sock) { return; }
        data.super_sock_id = rtc.id;
        ssm_sock.emit('super_signal', data);
    });
    rtc.on('I_want_you', function (data) {
        var ssm_sock = io.sockets.connected[data.ssm_sock_id];
        if (!ssm_sock) { return; }
        data.super_sock_id = rtc.id;
        ssm_sock.emit('I_want_you', data);
    });
    rtc.on('supervisor_online', function (data) {
        rtc.join('supervisor');
        rtc.emit('ssms_all_yours', ssms);
        // console.log(ssms);
    });
    rtc.on('ssm_online', function (data) {
        if (!data) return;
        rtc.join('ssm');
        data.ssm_sock_id = rtc.id;
        let sk = data.my_ip + data.dev_id;
        let hash = crypto.createHash('md5');
        sk = hash.update(sk, 'utf8').digest('hex');
        data.ssm_hash = sk;
        ssms[sk] = data;
        // console.log(data);
        rtc.to('supervisor').emit('ssms_all_yours', ssms);
        rtc.on('disconnect', () => {
            delete ssms[sk];
            rtc.to('supervisor').emit('ssms_all_yours', ssms);
        });
    });

}

module.exports = sig_rtc;