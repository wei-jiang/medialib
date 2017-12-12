import io from 'socket.io-client';
import Peer from 'simple-peer';
// import iconv from 'iconv-lite';
import _ from 'lodash';


let count = 0;
export class Sock {
    get_ssms() {
        let ssm_array = Object.keys(this.ssms).map((key) => {
            let s = this.ssms[key];
            return s;
        });
        return ssm_array;
    }
    get_ssm_hash(ssm) {
        let sk = ssm.my_ip + ssm.dev_id;
        //how to hash sk?
        return ssm.ssm_hash;
    }
    constructor(store) {
        this.peers = this.ssms = {};
        this.store = store;
        this.wwwRoot = window.location.href;
        if (this.wwwRoot.substr(this.wwwRoot.lenght - 1, 1) != "/") {
            this.wwwRoot = this.wwwRoot.substr(0, this.wwwRoot.lastIndexOf("/"));
        }

        this.commit_ssm_slowly = _.throttle(this.commit_ssm, 60 * 1000);
    }
    init() {
        let token_id = sessionStorage.getItem('token_id');
        // console.log(`connect to / use ${token_id}`)
        this.sock = io.connect('/', {
            'query': 'token=' + token_id
        });
        this.sock.on("error", function (error) {
            if (error.type == "UnauthorizedError" || error.code == "invalid_token") {
                router.replace('/login');
            }
        });
        // this.sock.on("unauthorized", function (error) {
        //     console.log(`unauthorized`);
        //     if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
        //         console.log("User's token has expired");
        //         router.go('/login');
        //     }
        // });
        // this.sock = io.connect(this.wwwRoot);
        this.sock.on('connect', () => {
            console.log("on connected to signal server");
            this.sock.emit('supervisor_online', 'freego');
        });
        this.sock.on('disconnect', () => {
            console.log("disconnect to signal server");
            this.sock.removeAllListeners();
        });
        this.sock.on('ssms_all_yours', (data) => {
            // console.log('ssms_all_yours', data);
            Object.values(data).forEach((s) => {
                s.duration = '';
                s.pendingVersion = '';
                s.peer = null;
                s.stream = null;
                s.dsk_stream = null;
            })
            this.ssms = data;

            this.store.commit('set_ssms', this.ssms);
        });
        this.sock.on('ssm_signal', (data) => {
            // console.log('ssm_signal', data);
            let sh = this.get_ssm_hash(data);
            let p = this.peers[sh];
            p.signal(data.ssm_sig_data);
        });
    }
    get_log(ssm) {
        this.sock.emit('send_log', ssm);
    }
    commit_ssm(ssm) {
        ssm = _.cloneDeep(ssm); //for store commit
        this.store.commit('set_ssm', {
            id: ssm.ssm_hash,
            value: ssm
        });
    }
    commit_ssm_value(id, id2, value) {
        this.store.commit('set_ssm_value', {
            id: id,
            id2: id2,
            value: value
        });
    }
    req_dsk(ssm) {
        if(ssm.peer.p_dsk){
            ssm.peer.p_dsk.destroy();
            delete ssm.peer.p_dsk;
            ssm.dsk_stream = null;
            return;
        }
        ssm.peer.p_dsk = new Peer({
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
        })
        ssm.peer.p_dsk.on('signal', (sig_data) => {
            let data = JSON.stringify({
                payload: sig_data,
                cmd: 'dsk_sig_data'
            });
            // console.log('ssm.peer.p_dsk.on signal');
            ssm.peer.send(data);
        });
        ssm.peer.p_dsk.on('error', (e) => {
            console.log('peer.p_dsk error', e);
            delete ssm.peer.p_dsk;
            $(`#${ssm.ssm_hash + '_dsk'}`).hide();
        });
        ssm.peer.p_dsk.on('close', () => {
            console.log('peer.p_dsk closed');
            delete ssm.peer.p_dsk;
            $(`#${ssm.ssm_hash + '_dsk'}`).hide();
        })
        ssm.peer.p_dsk.on('connect', () => {
            console.log('peer.p_dsk connect');
        });
        ssm.peer.p_dsk.on('stream', (stream) => {
            console.log('on peer.p_dsk stream');
            this.commit_ssm_value(ssm.ssm_hash, 'dsk_stream', stream);
            $(`#${ssm.ssm_hash + '_dsk'}`)[0].src = window.URL.createObjectURL(stream);
            $(`#${ssm.ssm_hash + '_dsk'}`).show(600);
        });
        ssm.peer.send(JSON.stringify({
            cmd: 'req_dsk'
        }));
    }
    new_ssm_peer(ssm, local_stream, cb) {

        var peer = new Peer({
            stream: local_stream, trickle: true,
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
        let sh = this.get_ssm_hash(ssm);
        this.peers[sh] = peer;
        this.sock.emit('I_want_you', ssm);
        peer.on('signal', (data) => {
            ssm.super_sig_data = data;
            // console.log(ssm);                      
            this.sock.emit('super_signal', ssm);
        });
        peer.on('error', (e) => {
            console.log('Error sending connection to peer', e);
            delete this.peers[sh];
            alert('建立连接失败');
            cb();
        });
        peer.on('close', () => {
            console.log('Peer connection closed');
            $(`#${sh}`).hide();
            if(peer.p_dsk) {
                peer.p_dsk.destroy();
                this.commit_ssm_value(sh, 'dsk_stream', null);
                $(`#${sh + '_dsk'}`).hide();
                delete peer.p_dsk;
            } 
            this.commit_ssm_value(sh, 'stream', null);
            this.commit_ssm_value(sh, 'peer', null);
            delete this.peers[sh];
        })
        peer.on('connect', () => {
            console.log('Peer connection established');
            // ssm.peer = peer;
            this.commit_ssm_value(sh, 'peer', peer);
            cb();
            // peer.send("hey peer, I am a supervisor");
        });
        peer.on('data', (data) => {
            // console.log('Recieved data from peer:', data.toString());
            try {
                data = JSON.parse(data.toString());
                if (data.cmd == 'dsk_sig_data') {
                    peer.p_dsk.signal(data.payload);

                } else {
                    if (data.pendingVersion) {
                        this.commit_ssm_value(sh, 'pendingVersion', data.pendingVersion);
                    }
                    if (data.duration) {
                        this.commit_ssm_value(sh, 'duration', data.duration);
                    }
                    ///////////////////////////////
                    if (data.printer_state) {
                        this.commit_ssm_value(sh, 'printer_state', data.printer_state);
                    }
                    if (data.ssm_enabled) {
                        this.commit_ssm_value(sh, 'ssm_enabled', data.ssm_enabled);
                    }
                    if (data.printer_mileage) {
                        this.commit_ssm_value(sh, 'printer_mileage', data.printer_mileage);
                    }
                    if (data.printer_cut_cnt) {
                        this.commit_ssm_value(sh, 'printer_cut_cnt', data.printer_cut_cnt);
                    }
                }
            }
            catch (err) {

            }
        });
        peer.on('stream', (stream) => {
            console.log('on peer stream');
            this.commit_ssm_value(sh, 'stream', stream);
            $(`#${sh}`)[0].src = window.URL.createObjectURL(stream);
            $(`#${sh}`).show(600);
            // this.commit_ssm_value(sh, 'stream', stream);
            cb();
        });
    }

    fini() {
        this.sock.close();
        this.sock = null;
    }
}
// export let sock = new Sock();