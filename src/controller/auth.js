/* eslint-disable no-console */
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user');

const { secret } = config;

module.exports.authenticateUser = async (req, resp) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return resp.status(400).json({ message: 'email or password missing' });
  }

  const userSearch = User.findOne({ email });
  userSearch
    .then((doc) => {
      if (doc === null) return resp.status(404).json({ message: 'User does not exist' });

      const matchPass = User.comparePassword(password, doc.password);

      matchPass
        .then((pass) => {
          if (!pass) return resp.status(404).json({ token: null, message: 'Invalid Password' });

          jwt.sign(
            {
              uid: doc._id,
              email: doc.email,
              roles: doc.roles,
            },
            secret,
            {
              expiresIn: 3600,
            },
            (err, token) => {
              if (err) console.log(err);

              return resp.status(200).json({ token });
            },
          );
        });
    });
};
