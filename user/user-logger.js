const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;

// Console logs up to debug, infoFile only logs up to info
const transports = {
  console: new winston.transports.Console(),
  infoFile: new winston.transports.File({ filename: 'user_app.log', level: 'info' })
};

const logFormat = printf(({ level, message, timestamp, src }) => {
  if (!src) {
    src = '?';
  }
  return `${timestamp} [${level}] ${src}: ${message}`;
});

const logger = winston.createLogger({
  level: 'debug',
  format: combine(
    timestamp(),
    logFormat
  ),
  transports: [
    transports.console,
    transports.infoFile
  ]
});

module.exports = {logger: logger};
