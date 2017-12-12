<template>
  <div class="HolyGrail">
    <header>
      <img src="../assets/logo.png">
    </header>
    <div class="HolyGrail-body">
        <nav class="left-nav">

        </nav>
        <div class="HolyGrail-content">

        </div>
        <nav class="right-nav">
            <div v-for="v in videos">
              <div class="video_info" >
                <video preload="metadata" width="100%">
                  <source :src="`/video?id=${v._id}#t=5.0`" type="video/mp4" />
                </video>
                <div>名称：{{v.filename}}</div>
                <div>大小：{{v.length}}</div>
                <div>上传时间：{{v.uploadDate}}</div>
                <button class="btn fit-parent negative" @click="delete_item(v)" >删除</button>
              </div>
            </div>
            <input type="file" @change="processFile($event)">
            <button v-on:click="upload_video()" class="btn btn-primary">上传视频(mp4)</button>
            <button v-on:click="clear_all_video()" class="btn btn-primary">清除所有视频</button>
        </nav>
    </div>
    <footer class="well">
        <div>
            智慧旅游网络科技有限公司2015-2017
        </div>
        <div id='summay'>

        </div>
    </footer>
</div>
</template>

<script>

import moment from "moment";
import net from '../net'

export default {
  name: "AdsMgr",
  created: function() {
    this.$root.$on("refresh_file_list", data => {
      this.get_files_info();
    });
  },
  data() {
    return {
      videos: []
    };
  },
  mounted() {
    this.get_files_info();
  },
  methods: {
    delete_item(v) {

    },
    get_files_info() {
      net.sock.emit("get_file_list_by_type", { type: "video/mp4" }, files => {
        // console.log(files)
        this.videos = files;
      });
    },
    clear_all_video() {
      net.sock.emit("drop_all_files", "");
    },
    upload_video() {
      $('input[type="file"]').click();
    },
    processFile(event) {
      if (event.target.files.length == 0) return;
      let file = event.target.files[0];
      let stream = ss.createStream();
      ss(net.sock).emit("upload_file", stream, {
        name: file.name,
        type: file.type,
        size: file.size,
        metadata: ""
      });
      let size = 0;
      stream.on("data", function(chunk) {
        size += chunk.length;
        console.log(Math.floor(size / file.size * 100) + "%");
        // -> e.g. '42%'
      });
      ss.createBlobReadStream(file).pipe(stream);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.video_info{
  display: flex;
  flex-direction: column;
  margin-bottom: 5px;
}
.panel-heading {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.HolyGrail {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.HolyGrail-content {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  /*justify-content:space-around;*/
}

.left-nav,
.right-nav {
  display: flex;
  flex-direction: column;
  /* order: -1;*/
  flex: 0 0 12em;
}
.right-nav {
  margin-left: auto;
}
.HolyGrail-body {
  display: flex;
  flex-direction: row;
  flex: 1;
}

header,
footer {
  display: flex;
  flex-direction: row;
}
#summay {
  margin-left: auto;
}
.logout {
  margin-left: auto;
}
input[type="file"] {
  display: none;
}
.right-nav > button.btn-primary {
  margin-top: auto;
}
</style>
