const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥. Shutting down');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
// console.log(process.env);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successfull'));
// console.log(process.env);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

//Central place to handle all promise rejection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥. Shutting down');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
