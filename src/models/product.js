const { Schema, model } = require('mongoose');

const ProductSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0, required: true },
  image: { type: String, required: true },
  type: { type: String, required: true },
  dateEntry: { type: Date, default: Date.now },
});

module.exports = model('Product', ProductSchema);
