import _ from 'lodash'
import Peer from 'simple-peer';
const moment = require('moment');
import ss from "socket.io-stream";

class Net {
  constructor() {
    if (typeof io != "undefined") {
      this.sock = io();
      this.sock.on('connect', this.on_connect.bind(this));
      this.sock.on('refresh_file_list', this.on_refresh_file_list.bind(this));
      ////////////////////////////////
      this.peers = {}
      this.rtc_sock = io('/rtc');
      this.rtc_sock.on('connect', this.on_rtc_connect.bind(this));
      this.rtc_sock.on('disconnect', () => {
        console.log("disconnect to rtc server");
        this.rtc_sock.removeAllListeners();
      });
      this.rtc_sock.on('ssms_all_yours', (data) => {
        vm.$emit('set_ssms', data);
      });
      this.rtc_sock.on('ssm_signal', (data) => {
          // console.log('ssm_signal', data);
          let p = this.peers[data.ssm_hash];
          p.signal(data.ssm_sig_data);
      });
    }
  }
  register_ui_evt() {
    vm.$on("notify_seller_status", data => {
      this.emit('notify_seller_status', data)
    });
  }

  on_connect() {
    // this.register_ui_evt()
  }
  on_rtc_connect() {
    console.log('on_rtc_connect')
    this.rtc_sock.emit('supervisor_online', 'freego');
  }
  on_refresh_file_list(data) {
    vm.$emit('refresh_file_list', '');
  }
  emit(name, data, cb) {
    if (this.sock) {
      this.sock.emit(name, data, cb)
    }
  }
  rtc_emit(name, data, cb) {
    if (this.rtc_sock) {
      this.rtc_sock.emit(name, data, cb)
    }
  }
  upload_file(file) {
    let stream = ss.createStream();
    let blobStream = ss.createBlobReadStream(file);
    ss(this.sock).emit("upload_file", stream, {
      name: file.name,
      type: file.type,
      size: file.size,
      metadata: ""
    });
    let size = 0;
    blobStream.on("data", function (chunk) {
      size += chunk.length;
      let progress = Math.floor(size / file.size * 100);
      vm.$emit('on_load_progress', progress);
      // console.log(progress + "%");
      // -> e.g. '42%'
    });

    blobStream.pipe(stream);
  }
  new_ssm_peer(ssm, cb) {
    let peer = new Peer({
      trickle: true,
      config: {
        iceServers: [
          { url: 'stun:139.224.228.83' },
          {
            url: 'turn:139.224.228.83',
            username: 'freego',
            credential: 'freego2017'
          },
          {
            url: 'turn:numb.viagenie.ca',
            username: 'david@cninone.com',
            credential: 'freego2017'
          }
        ]
      }
    });
    this.peers[ssm.ssm_hash] = peer;
    // console.log(" this.rtc_emit('I_want_you', ssm); ")
    this.rtc_emit('I_want_you', ssm);
    peer.on('signal', (data) => {
      ssm.super_sig_data = data;
      // console.log(ssm);                      
      this.rtc_emit('super_signal', ssm);
    });
    peer.on('error', (e) => {
      console.log('Error sending connection to peer', e);
      delete this.peers[ssm.ssm_hash];
      alert('建立连接失败');
    });
    peer.on('close', () => {
      console.log('Peer connection closed');
      delete this.peers[ssm.ssm_hash];
    })
    peer.on('connect', () => {
      console.log('Peer connection established');
      ssm.peer = peer;
      // peer.send("hey peer, I am a supervisor");
    });
    peer.on('data', (data) => {
      // console.log('Recieved data from peer:', data.toString());
      
    });
    peer.on('stream', (stream) => {
      console.log('on peer stream');
      cb(stream);
    });
  }
}
export default new Net;