import Vue from 'vue';
import template from './app.html';
import css from './app.css';
import { Sock } from '../../dealers/sock';


const AppComponent = Vue.extend({
    template,
    destroyed: function () {
        // console.log('app component destroyed')
        this.sock.fini();
        // this.$root.$off('get_qr_code', this.handle_qr);
    },
    created: function () {
        // console.log('app component created')
        this.sock = new Sock(this.$store);
        this.sock.init();
        // this.$root.$on('get_qr_code', this.handle_qr);
    },
    beforeRouteEnter(to, from, next) {
        sessionStorage.getItem('token_id') ? next() : next('/login');
    },
    data() {

        return {
            message: '你好，世界!',
            todos: [
                { text: 'Learn JavaScript' },
                { text: 'Learn Vue' },
                { text: 'Build something awesome' }
            ]
        }
    },
    computed: {
        ssms() {

            return this.$store.state.ssms;
        },
        summary() {
            let sa = Object.values(this.$store.state.ssms);
            let sum = sa.length;
            let statistics = {};
            let rs = `总数：${sum};`;
            sa.forEach(s => {
                statistics[s.type] = statistics[s.type] ? ++statistics[s.type] : 1;
            })
            for (let type in statistics) {
                rs += ` ${type}：${statistics[type]};`;
            }
            return rs;
        },
        types() {
            return this.$store.state.types;
        },
        wanted() {
            return this.$store.state.wanted;
        }
    },
    methods: {
        logout() {
            sessionStorage.removeItem('token_id');
            this.$router.replace('/login');
        },
        sel_type(t) {
            this.$store.state.wanted = Object.values(this.$store.state.ssms).filter(s => {
                return t.name == 'all' ? true : s.type == t.name;
            });
            this.$store.state.types.forEach((type) => {
                type.active = type.name == t.name;
            });
            this.$nextTick(() => {
                this.$store.state.wanted.forEach(s => {
                    // console.log(s);
                    if (s.stream) {
                        $(`#${s.ssm_hash}`)[0].src = window.URL.createObjectURL(s.stream);
                        $(`#${s.ssm_hash}`).show(600);
                    }
                    else {
                        $(`#${s.ssm_hash}`).hide();
                    }
                })
            })
        },
        update_ssm(ssm) {
            var r = confirm("确认升级并重启自助机程序吗？");
            if (r == true) {
                ssm.peer.send(JSON.stringify({
                    cmd: 'update'
                }));
            }

        },
        req_dsk(ssm) {
            this.sock.req_dsk(ssm);
        },
        get_log(ssm, type) {
            ssm.log_type = type;
            this.sock.get_log(ssm);
            alert("已发送命令，请稍候查看邮件。");
        },
        nav2bar() {
            console.log(this.$store);
            // console.log(this.$router);
            // this.$router.push('bar')
        },
        toggle_video(ssm, ssm_V) {
            if (ssm.peer) {
                ssm.peer.destroy();
                ssm.peer = null;
                return;
            }
            if ('wait' == $(ssm_V).css('cursor')) {
                return;
            }
            // console.log(ssm_V);
            $(ssm_V).css('cursor', 'wait');
            this.sock.new_ssm_peer(ssm, this.local_stream, (/*stream*/) => {
                // ssm_V.src = window.URL.createObjectURL(stream);
                $(ssm_V).css('cursor', 'pointer');
            });
        }
    }
});

export default AppComponent;