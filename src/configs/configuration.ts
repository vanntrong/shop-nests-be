export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.USER_DATABASE_HOST,
    port: parseInt(process.env.USER_DATABASE_PORT, 10) || 5432,
    username: process.env.USER_DATABASE_USERNAME,
    password: process.env.USER_DATABASE_PASSWORD,
    database: process.env.USER_DATABASE_NAME,
  },
  redis: {
    host: process.env.USER_REDIS_HOST,
    port: parseInt(process.env.USER_REDIS_PORT, 10) || 6379,
  },
  jwt: {
    access_token_secret: process.env.USER_ACCESSTOKEN_SECRET,
    access_token_expires_in: +process.env.USER_ACCESSTOKEN_EXPIRES_IN,
    refresh_token_secret: process.env.USER_REFRESHTOKEN_SECRET,
    refresh_token_expires_in: +process.env.USER_REFRESHTOKEN_EXPIRES_IN,
    mail_token_secret: process.env.USER_MAILTOKEN_SECRET,
    mail_token_expires_in: +process.env.USER_MAILTOKEN_EXPIRES_IN,
  },

  aws: {
    accessKeyId: process.env.USER_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.USER_AWS_ACCESS_KEY_SECRET,
  },
  mail: {
    host: process.env.USER_MAIL_HOST,
    port: parseInt(process.env.USER_MAIL_PORT, 10) || 533,
    secure: false,
    auth: {
      user: process.env.USER_MAIL_AUTH_USER,
      pass: process.env.USER_MAIL_AUTH_PASS,
    },
  },
});
