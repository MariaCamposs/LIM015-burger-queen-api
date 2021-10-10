/* eslint-disable func-names */
/* eslint-disable no-console */
const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const mongoosePaginate = require('mongoose-paginate-v2');

const userSchema = new Schema({
  email: {
    type: String, unique: true, lowercase: true, required: true,
  },
  password: { type: String, required: true },
  roles: { admin: { type: Boolean, default: false } },
},
{
  timestamps: true,
  versionKey: false,
});

userSchema.statics.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

// comparando la version texto de la contraseña
// con la version encriptada en la base de datos
userSchema.statics.comparePassword = async (password, receivedPassword) => {
  const result = await bcrypt.compare(password, receivedPassword);
  return result;
};

userSchema.pre('findOneAndUpdate', async function () {
  this._update.password = await bcrypt.hash(this._update.password, 10);
});

userSchema.plugin(mongoosePaginate);

module.exports = model('User', userSchema);
