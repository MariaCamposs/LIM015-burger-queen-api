const mongoose = require('mongoose');
const config = require('./config');

const connect = (url = config.dbUrl) => {
  mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .catch((error) => console.error(error));
  mongoose.connection.once('open', () => console.info('Base de datos conectada online', url));
  mongoose.connection.on('error', (error) => console.error(error));
};

const close = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  } catch (error) {
    console.info(error);
  }
};

module.exports = {
  connect, close,
};
