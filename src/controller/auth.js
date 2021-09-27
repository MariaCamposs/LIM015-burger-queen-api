/* eslint-disable no-console */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config');
const User = require('../models/user');

const { secret } = config;

module.exports.authenticateUser = async (req, resp, next) => {
  const { email, password } = req.body;
  console.log(email, password);

  if (!email || !password) {
    return next(400);
  }

  const userFind = User.findOne({ email });
  userFind.then((doc) => {
    if (!doc) {
      return resp.status(400).json({
        message: 'Usuario no existe',
      });
    }

    bcrypt.compare(password, doc.password, (err, data) => {
      if (err) console.info(err);

      else if (!data) {
        return resp.status(404).json({
          message: 'Contraseña incorrecta',
        });
      }
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
