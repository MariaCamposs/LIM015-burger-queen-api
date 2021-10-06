const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0, required: true },
  image: { type: String },
  type: { type: String },
  dateEntry: { type: Date, default: Date.now },
},
{
  timestamps: true,
  versionKey: false,
});

productSchema.plugin(mongoosePaginate);
module.exports = model('Product', productSchema);
