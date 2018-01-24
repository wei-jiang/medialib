import Noty from 'noty'
function show_noty(msg) {
    new Noty({
        layout: 'center',
        timeout: 3000,
        text: msg
    }).show();
}
export default {
    getRandFloat: (min, max) => {
        return Math.random() * (max - min) + min;
    },
    getRandInt: (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    show_noty
}
