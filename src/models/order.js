const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const orderSchema = new Schema({
  userId: { type: String, required: true },
  client: { type: String, required: true },
  products: [{
    qty: { type: Number, required: true },
    product: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
  }],
  status: { type: String, default: 'pending', required: true },
  dateEntry: { type: Date, default: Date.now },
  dateProcessed: { type: Date, required: true },
});

orderSchema.plugin(mongoosePaginate);
module.exports = model('Order', orderSchema);
