// import sendmail from 'sendmail';
import { log } from 'electron-log';

export const sendFeedback = (to: string, subject: string, message: string) => {
  const sendmail = require('sendmail')();

  sendmail(
    {
      from: 'feedback@benjamintourrette.com',
      to: 'feedback@benjamintourrette.com',
      subject: subject,
      html: message,
    },
    function (err, reply) {
      console.log(err && err.stack);
      console.dir(reply);
    },
  );
};
