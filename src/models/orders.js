const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrderSchema = new Schema({
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

module.exports = mongoose.model('Order', OrderSchema);
