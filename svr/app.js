const assert = require('assert');
const fs = require('fs');
const path = require('path');
const app = require('express')();
const nunjucks = require('nunjucks');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ss = require('socket.io-stream');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const xmlparser = require('express-xml-bodyparser');
const request = require('request');
const querystring = require('querystring');
const favicon = require('serve-favicon');
const moment = require('moment');
const _ = require('lodash');
const uuidv1 = require('uuid/v1');
const uuidv4 = require('uuid/v4');
const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId; 
const jwt = require('jsonwebtoken');
const socketioJwt = require("socketio-jwt");
const expressJwt = require('express-jwt');
const credential = require('./secret')

app.set('port', process.env.PORT || 7901);

nunjucks.configure('views', {
    autoescape: true,
    express: app
});
app.use(session({ secret: credential.session_key }));
app.use(require('express').static(__dirname + '/public'));

app.use(helmet());
app.use(cors());
app.use(xmlparser());
app.use(cookieParser());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


let mdb = null, bucket;
let CHUNKS_COLL = 'fs.chunks';
let FILES_COLL = 'fs.files';
mongodb.MongoClient.connect(credential.db_url, function (error, client) {
    assert.ifError(error);
    const db = client.db(credential.db_name);
    mdb = db;
    bucket = new mongodb.GridFSBucket(db);

});
server.listen(app.get('port')
    // , 'localhost'
    , () => {
        console.log("Express server listening on port " + app.get('port'));
    }
);
app.get('/media', function (req, res) {
    let fid = req.query.id;
    if(!fid) return res.end('file no found');
    // console.log('/media?id='+fid)
    fid = new ObjectId(fid);
    mdb.collection('fs.files').findOne({ "_id": fid })
        .then(fi => {
            // console.log(fi)
            if (fi) {
                stream_media(req, res, fi)
            } else {
                res.end('file no found')
            }

        })
});
function stream_media(req, res, fi) {
    if (req.headers['range']) {
        // Range request, partialle stream the file
        // console.log('Range Reuqest');
        var parts = req.headers['range'].replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : fi.length - 1;
        var chunksize = (end - start) + 1;
        // console.log('Range ', start, '-', end);
        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + fi.length,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': fi.contentType
        });
        bucket.openDownloadStream(fi._id, {
            start,
            end
        })
            .pipe(res).
            on('error', function (error) {
                assert.ifError(error);
            }).
            on('finish', function () {
                console.log('pipe media stream trunk done!');
            });

    } else {

        // stream back whole file
        // console.log('No Range Request');
        res.header('Content-Type', fi.contentType);
        res.header('Content-Length', fi.length);
        bucket.openDownloadStream(fi._id)
            .pipe(res).
            on('error', function (error) {
                assert.ifError(error);
            }).
            on('finish', function () {
                console.log('pipe whole media stream done!');
            });
    }
}

// io.use(socketioJwt.authorize({
//   secret: 'freego_20170406',
//   handshake: true
// }));
const sig_rtc = require('./dealers/rtc_sig')
sig_rtc(io)
io.on('connection', function (socket) {
    ss(socket).on('upload_file', function (stream, data) {
        stream.pipe(bucket.openUploadStream(data.name, {
            contentType: data.type,
            metadata: data.metadata
        }))
            .on('error', function (error) {
                assert.ifError(error);
            })
            .on('finish', function () {
                console.log('upload_file done!');
                socket.emit('refresh_file_list','')
                socket.broadcast.emit('refresh_file_list','')
            });
    });
    socket.on('drop_all_files', function (data) {
        bucket.drop().then(() => {
            console.log('deleted all files in mongodb')
            socket.emit('refresh_file_list','')
            socket.broadcast.emit('refresh_file_list','')
        });
        
    });
    socket.on('delete_file_by_id', function (data) {
        bucket.delete( new ObjectId(data.id) ).then(() => {
            console.log(`deleted file of ${data.id}`)
            socket.emit('refresh_file_list','')
            socket.broadcast.emit('refresh_file_list','')
        });        
    });
    socket.on('get_file_list_by_type', function (data, cb) {
        let cond = { contentType: data.type };
        if( _.isArray(data.type) ){
            cond = _.map(data.type, t=>{
                return {
                    contentType: t
                }
            })
            cond = {$or:cond}
        }
        let chunksQuery = mdb.collection(FILES_COLL).find(cond);
        chunksQuery.toArray()
        .then(files=>{
            // console.log(files)
            cb(files)
        })
    });
});
