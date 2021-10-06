const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const orderSchema = new Schema({
  userId: { type: String, required: true },
  client: { type: String },
  products: [{
    qty: { type: Number },
    product: { ref: 'Product', type: Schema.Types.ObjectId, required: true },
  }],
  status: { type: String, default: 'pending', required: true },
  dateEntry: { type: Date, default: Date.now },
  dateProcessed: { type: Date, required: true, default: Date.now },
},
{
  timestamps: true,
  versionKey: false,
});

orderSchema.plugin(mongoosePaginate);
module.exports = model('Order', orderSchema);
