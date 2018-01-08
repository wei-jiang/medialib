<template>
  <div class="HolyGrail">
    <header style="justify-content: space-around; background-color:#C5CAE9;">
        <div style="color:grey;">
          <h1>宜宾海洋馆广告自助机管理平台</h1>
        </div>       
    </header>
    <div class="HolyGrail-body">
        <nav class="left-nav">
          <v-toolbar color="light-blue" dark>
            <v-toolbar-title>在线自助机</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <div style="display:flex;flex-direction: column;">
            <div v-for="s in ssms">
              {{s.dev_id}}<br>
              {{s.dev_loc}}<br>
              {{s.cphone}}<br>
              {{s.version}}<br>
              {{s.my_mac}}<br>
            </div>
          </div>
        </nav>
        <div class="HolyGrail-content" @dragover.prevent @drop="drop($event)">
          <video v-if="sel_video_id" id="video_player" 
            controls="controls" autoplay="autoplay" loop="loop" width="100%"
            >
            <source :src="sel_url" type="video/mp4" />
          </video>
          <v-carousel v-if="carousel" :interval="4000">
            <v-carousel-item v-for="(item,i) in sel_pics" v-bind:src="item.src" :key="i"></v-carousel-item>
          </v-carousel>
        </div>
        <nav class="right-nav">
          <v-tabs v-model="active">
            <v-tabs-bar class="cyan" dark>
              <v-tabs-item
                v-for="m_type in tabs"
                :key="m_type"
                :href="'#' + m_type"
                ripple
              >
              {{ m_type }}
              </v-tabs-item>
              <v-tabs-slider color="yellow"></v-tabs-slider>
            </v-tabs-bar>
            <v-tabs-items>
              <v-tabs-content key="视频" id="视频" class="media-list">
       
                  <div v-for="v in videos">
                    <div class="video_info" draggable="true" @dragstart="drag(v, $event)">
                      <video preload="metadata" width="100%">
                        <source :src="`/media?id=${v._id}#t=7.9`" type="video/mp4" />
                      </video>
                      <div>名称：{{v.filename}}</div>
                      <div>大小：{{formatFileSize(v.length)}}</div>
                      <div>上传时间：{{formatDT(v.uploadDate)}}</div>
                      <button class="btn fit-parent negative" @click="delete_item(v)" >删除</button>
                    </div>
                  </div>
                  <input type="file" @change="processFile($event)">
                  <v-progress-circular 
                    v-if="load_progress"
                    v-bind:size="150"
                    v-bind:width="30"
                    v-bind:rotate="-90"
                    v-bind:value="load_progress"
                    color="teal"
                  >
                    {{ load_progress + '%'}}
                  </v-progress-circular>
                  <button v-on:click.prevent="upload_video()" class="btn btn-primary">上传视频(mp4)</button>
                  <button v-on:click.prevent="clear_all_video()" class="btn btn-primary">清除所有视频</button>
 
              </v-tabs-content>
              <v-tabs-content key="图片" id="图片" class="media-list" >
                <v-card flat draggable="true" @dragstart="drag_pics($event)">
                  <div v-for="p in pictures">
                    <div class="video_info">
                      <v-checkbox
                        v-bind:label="`选择后拖拽至左侧播放窗口(${p.sel?'已选择':'未选择'})`"
                        v-model="p.sel"
                        :color="'primary'"
                      ></v-checkbox>
                      <img :src="`/media?id=${p._id}`" width="100%"/>  
                      <div>名称：{{p.filename}}</div>
                      <div>大小：{{formatFileSize(p.length)}}</div>
                      <div>上传时间：{{formatDT(p.uploadDate)}}</div>
                      <button class="btn fit-parent negative" @click="delete_item(p)" >删除</button>
                    </div>
                  </div>
                  <v-progress-circular 
                    v-if="load_progress"
                    v-bind:size="100"
                    v-bind:width="15"
                    v-bind:rotate="-90"
                    v-bind:value="load_progress"
                    color="teal"
                  >
                    {{ load_progress + '%'}}
                  </v-progress-circular>
                  <button v-on:click.prevent="upload_picture()" class="btn btn-primary">上传图片</button>
                  <button v-on:click.prevent="clear_all_pic()" class="btn btn-primary">清除所有图片</button>
                </v-card>
              </v-tabs-content>
            </v-tabs-items>
          </v-tabs>
            
        </nav>
    </div>
    
</div>
</template>

<script>
import moment from "moment";
import Noty from "noty";
import _ from "lodash";
// import $ from 'jquery';
// require("imports-loader?window.jQuery=jquery!jr3dcarousel/src/jR3DCarousel.js")
// import 'script-loader!jr3dcarousel/src/jR3DCarousel.js'

import net from "../net";

export default {
  name: "AdsMgr",
  created: function() {
    this.$root.$on("refresh_file_list", data => {
      this.get_files_info();
    });
    this.$root.$on("on_load_progress", data => {
      this.load_progress = data > 0 && data < 100 ? data : 0;
    });
    this.$root.$on("set_ssms", data => {
      console.log(data)
      this.ssms = data
    });
  },
  data() {
    return {
      ssms:[],
      videos: [],
      pictures: [],
      sel_video_id: "",
      carousel: false,
      sel_pics:[],
      load_progress: 0,
      tabs: ["视频", "图片"],
      active: null
    };
  },
  computed: {
    sel_url() {
      return `/media?id=${this.sel_video_id}`;
    }
  },
  mounted() {
    this.get_files_info();
  },
  methods: {
    upload_picture() {
      this.upload_video();
    },
    clear_all_pic() {},
    drag_pics(e) {
      let sel_imgs = _.filter(this.pictures, "sel");
      sel_imgs = _.map(sel_imgs, i => {
        return {
          id: i._id,
          contentType: i.contentType
        };
      });
      // console.log(sel_imgs);
      e.dataTransfer.setData(
        "selected_media",
        JSON.stringify({
          type: "picture",
          data: sel_imgs
        })
      );
    },
    formatDT(dt) {
      return moment(dt).format("YYYY-MM-DD HH:mm:ss");
    },
    formatFileSize(bytes, decimalPoint) {
      if (bytes == 0) return "0 Bytes";
      let k = 1000,
        dm = decimalPoint || 2,
        sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
        i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    drag(v, e) {
      // console.log('drag started', v, e);
      e.dataTransfer.setData(
        "selected_media",
        JSON.stringify({
          type: "video",
          data: {
            id: v._id,
            contentType: v.contentType
          }
        })
      );
    },
    drop(e) {
      // console.log('Looks like you dropped something!', e);
      let m = e.dataTransfer.getData("selected_media");
      m = JSON.parse(m);
      this.carousel = false
      if (m.type == "video") {
        this.sel_video_id = m.data.id;
        this.$nextTick(() => {
          $("#video_player")[0].load();
        });
      } else {
        this.sel_video_id = "";
        if( 0 === _.size( m.data) ) {
          return alert('未选择图片')
        }        
        this.sel_pics = _.map(m.data, i=>{
          return {"src":`/media?id=${i.id}`}
        })
        this.$nextTick(() => (this.carousel = true))
        // console.log(this.sel_pics)
      }
    },
    delete_item(f) {
      net.sock.emit("delete_file_by_id", { id: f._id });
    },
    get_files_info() {
      net.sock.emit("get_file_list_by_type", { type: "video/mp4" }, files => {
        // console.log(files)
        this.videos = files;
      });
      this.get_imgs();
    },
    get_imgs() {
      net.sock.emit(
        "get_file_list_by_type",
        { type: ["image/png", "image/jpeg", "image/bmp"] },
        files => {
          // console.log(files)
          this.pictures = _.map(files, i => {
            i.sel = false;
            return i;
          });
        }
      );
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
      const allow_file_types = ["mp4", "png", "jpg", "gif", "bmp"];
      let ext = file.name
        .split(".")
        .pop()
        .toLowerCase();
      let valid = allow_file_types.indexOf(ext) > -1;
      if (!valid) {
        let n = new Noty({
          text: "文件格式错误，只能上传媒体文件。",
          layout: "center",
          buttons: [
            Noty.button("确定", "blue lighten-1", function() {
              console.log("button 2 clicked");
              n.close();
            })
          ]
        }).show();
        return;
      }
      net.upload_file(file);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.video_info {
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
  min-height: 92vh;
  flex-direction: column;
}

.HolyGrail-content {
  min-width: 60%;
  /* display: flex;
  flex-wrap: wrap; */
  flex: 1;
  /*justify-content:space-around;*/
}

.left-nav,
.right-nav {
  display: flex;
  flex-direction: column;
  /* order: -1;*/
  /* flex: 0 0 12em; */
  min-width: 20%;
  /* justify-content: center; */
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
.media-list{
  overflow:auto; 
  max-height:85vh;
}
</style>
