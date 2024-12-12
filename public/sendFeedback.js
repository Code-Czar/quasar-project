"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFeedback = void 0;
const sendFeedback = (to, subject, message) => {
    const sendmail = require('sendmail')();
    sendmail({
        from: 'feedback@benjamintourrette.com',
        to: 'feedback@benjamintourrette.com',
        subject: subject,
        html: message,
    }, function (err, reply) {
        console.log(err && err.stack);
        console.dir(reply);
    });
};
exports.sendFeedback = sendFeedback;
