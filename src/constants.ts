export const SERVER = {
  PORT: process.env.PORT || 8888,
  JWT_SECRET:
    '&?mL#r-E5RA-k!5R+YtFhUT5?W26=4?aT?yYvudS2QT-#nZR*shS+cqpmZT=WZQ5X^X6n8!j?Xq?Gq^tELvrSaGHe+un!6GrnkJ$fMt+cr2F3apmquA@^X6^5JF5VCc8*rEM&fXmGtxEYDMWjybCxXkMbfD_+*vwwshEDYudqYQsH3&UL$-3Pr+!H$_FH%v&*-Xgv$-74=@z-mC3?4MjYN*5yG&rC2LR#=T+7w4K&TG5sz49?q%H^NcwfWD9w*+U'
};

export const IS_PRODUCTION = process.env.ENV && process.env.ENV.toLowerCase() === 'live';

export const DATABASE = {
  MONGO: {
    URI: process.env.MONGO_URI || 'mongodb://localhost/new_db',
    PORT: 27017
  },
  POSTGRESQL: {}
};

export const TEMPLATES = {
  EMAIL_VERIFY: {
    SUBJECT: 'Activate Email - brand',
    BODY: 'i:{{id}} t:{{emailVerifyToken}} is your brand verification code.'
  },
  FORGOT_PASSWORD: {
    SUBJECT: 'Reset password - brand',
    BODY: '{{otp}} is your brand verification code.'
  },
  PHONE_VERIFY: '{{otp}} is your brand verification code.',
  EMAIL_SHARE_WITH_CLIENT: {
    SUBJECT: 'New version of album',
    BODY: 'Your photographer has shared a new version of your album. Please use referral code {{referralCode}}'
  },
  EMAIl_SHARE_WITH_PHOTOGRAPHER: {
    SUBJECT: 'Approval from client',
    BODY: 'Your client has shared his album with added comments.'
  },
  PHONE_SHARE_WITH_CLIENT: 'Your photographer has shared a new version of your album. Please use referral code {{referralCode}}',
  PHONE_SHARE_WITH_PHOTOGRAPHER: 'Your client has shared his album with added comments.',
};

export const S3 = {
  BUCKET: 'abproduction',
  ACCESS_KEY_ID: 'AKIAJESK36VT4XCIB3WQ',
  SECRET_ACCESS_KEY: 'Df/vPBzWhGlboHJDQRM7BAECekY0qw0sl30HF9za',
  S3_URL: 'https://s3.ap-south-1.amazonaws.com/abproduction/',
  FOLDER: {
    IMAGES: 'images/',
    VIDEOS: 'videos/'
  },
  thumbSize : ['200','600']
};
