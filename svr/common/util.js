const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const _ = require('lodash');
const moment = require('moment');
const credential = require('../secret')

function sign_token_1h(data) {
    return jwt.sign(data, credential.token_key, { expiresIn: '1h' });
}
function sign_token(data) {
    return jwt.sign(data, credential.token_key);
}
function verify_token(token, cb) {
    jwt.verify(token, credential.token_key, cb);
}
function verify_usr(data) {
    return new Promise((resolve, reject) => {
        if(data.token){
            verify_token(data.token, (err, decoded) => {
                if (err) {
                    reject(err)
                } else {
                    //remove token
                    delete data.token;
                    resolve(decoded);
                }
            })
        } else {
            reject('no login info presents')
        }        
    })
}
module.exports = {
    sign_token,
    sign_token_1h,
    verify_token,
    verify_usr
}