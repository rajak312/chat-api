export const origins = [
  'http://localhost:3000',
  'https://chat-sable-six.vercel.app',
  process.env.WEB_APP_ORIGIN,
  ...(process.env.ORIGIN || '').split(' '),
];

export const origin = (origin, callback) => {
  if (!origin) return callback(null, true);

  if (origins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('CORS not allowed'));
  }
};
