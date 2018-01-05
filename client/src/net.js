import _ from 'lodash'
const moment = require('moment');
import ss from "socket.io-stream";

class Net {
  constructor() {
    if (typeof io != "undefined") {
      this.sock = io();
      // this.rtc_sock = io('/rtc');
      this.sock.on('connect', this.on_connect.bind(this));
      this.sock.on('refresh_file_list', this.on_refresh_file_list.bind(this));
      ////////////////////////////////
      this.rtc_sock.on('connect', this.on_rtc_connect.bind(this));
      this.rtc_sock.on('disconnect', () => {
        console.log("disconnect to rtc server");
        this.rtc_sock.removeAllListeners();
      });
      this.rtc_sock.on('ssms_all_yours', (data) => {
        vm.$emit('set_ssms', data);
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
}
export default new Net;