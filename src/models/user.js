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

userSchema.pre('findOneAndUpdate', async function () {
  this._update.password = await bcrypt.hash(this._update.password, 10)
});

// comparando la version texto de la contraseña
// con la version encriptada en la base de datos
userSchema.methods.comparePassword = async (password, cb) => {
  try {
    const match = await bcrypt.compare(password, cb);
    if (!match) {
      throw new Error('Authentication error');
    }
    return match;
  } catch (error) {
    throw new Error('Wrong password.');
  }
};

userSchema.plugin(mongoosePaginate);

module.exports = model('User', userSchema);
