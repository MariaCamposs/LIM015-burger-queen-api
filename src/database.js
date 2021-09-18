const mongoose = require('mongoose');
const config = require('./config');

mongoose
  .connect(config.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  // eslint-disable-next-line no-console
  .then(console.log('Databe connected'))
  .catch(console.error);
