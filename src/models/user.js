/* eslint-disable func-names */
/* eslint-disable no-console */
const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new Schema({
  email: {
    type: String, unique: true, lowercase: true, required: true,
  },
  password: { type: String, required: true, select: false },
  roles: { admin: { type: Boolean, required: true } },
});

// Antes de guardar se ejecuta la siguiente funcion
userSchema.pre('save', function (next) {
  // si el usuario no ha modificado su contraseña
  // se termina la funcion
  const user = this;
  if (!user.isModified('password')) return next();

  // si no, con bcrypt se genera salto de 10
  bcrypt.genSalt(10, (err, salt) => {
    // si hay error pasa al siguiente
    if (err) return next(err);

    // si no, hashea la contraseña con el salt que se generó
    bcrypt.hash(user.password, salt, (err, hash) => {
      // si hay error devuelve el error
      if (err) return next(err);

      // si no hay error el password sera el hash
      user.password = hash;
      console.log('hash exito');
      next();
    });
  });
  console.log('exito');
});

userSchema.pre('findOneAndUpdate', (next) => {
  const user = this;
  if (!user._update.$set.password) return next();
  bcrypt.hash(user._update.$set.password, 10, (err, hash) => {
    if (err) return next(err);
    user._update.$set.password = hash;
    next();
  });
});

// comparando la version texto de la contraseña
// con la version encriptada en la base de datos
userSchema.methods.comparePassword = (password, cb) => {
  bcrypt.compare(password, this.password, (err, isMatch) => {
    // si ocurre un error retorna un cb
    if (err) return cb(err, false);
    // si no coinciden
    if (!isMatch) return cb(null, isMatch);
    // si coiciden retornará un callback
    // con null en el apartado del error y this (el modelo user) como argumentos.
    return cb(null, this);
  });
};

userSchema.plugin(mongoosePaginate);

module.exports = model('User', userSchema);
