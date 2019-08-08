import * as nodemailer from 'nodemailer';
import { logger } from '../logger';
import { config } from '../../config/config';

/**
 * Sleep helper
 *
 * @export
 * @param {number} ms
 * @returns {Promise<{}>}
 */
export function sleep(ms: number, intervalRef?: { id: NodeJS.Timeout | undefined }): Promise<{}> {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    if (intervalRef) {
      intervalRef.id = id;
    }
  });
}

export function sendMail(msg: string) {
  if (config.mail) {
    const {service, user, pass} = config.mail;
    const transporter = nodemailer.createTransport({
      service,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: user,
      to: user,
      subject: 'influx-crypto-watcher',
      text: msg,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      error ? logger.error(error) : logger.info('Email sent: ' + info.response);
    });
  }
}
