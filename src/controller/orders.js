/* eslint-disable max-len */
const Order = require('../models/order');
const { pagination, isObjectId } = require('../services/services');

// POST /orders
const newOrder = async (req, resp, next) => {
  try {
    const { userId, client, products } = req.body;

    if (!userId) {
      return resp.status(400).json({ message: 'Ingresar id de usuario' });
    }

    if (Object.keys(req.body).length === 0 || !products || products.length === 0) {
      resp.status(400).json({ message: 'No ingresó userId o productos' });
    }

    const newOrder = new Order({
      userId,
      client,
      products: products.map((elem) => ({
        qty: elem.qty,
        product: elem.productId,
      })),
    });

    const orderSave = await newOrder.save();
    const currentOrder = await Order.findOne({ _id: orderSave._id }).populate('products.product');
    return resp.status(200).json(currentOrder);
  } catch (err) {
    console.info(err, 'error final');
    next(404);
  }
};

// GET /orders
const getOrders = async (req, resp, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: { _id: -1 },
    };

    const orders = await Order.paginate({}, options);
    const url = `${req.protocolo}://${req.get('host') + req.path}`;
    const links = pagination(orders, url, options.page, options.limit, options.sort, orders.totalPages);

    resp.links(links);
    return resp.status(200).json(orders.docs);
  } catch (error) {
    return next(error);
  }
};

// GET/orders/:orderId
const getOneOrder = async (req, resp, next) => {
  try {
    const { orderId } = req.params;

    if (!isObjectId(orderId)) return next(404);

    const order = await Order.findOne({ _id: orderId }).populate('products.product');
    if (!order) return next(404);
    return resp.status(200).json(order);
  } catch (error) {
    return next(error);
  }
};

// PUT /orders/:orderId
const updateOrder = async (req, resp, next) => {
  try {
    const { orderId } = req.params;
    const { body } = req;

    if (!isObjectId(orderId)) return resp.status(404).json({ message: 'El formato del Id no es correcto' });
    if (Object.entries(body).length === 0) return next(400);

    const statusOrder = [
      'pending',
      'canceled',
      'delivering',
      'delivered',
      'preparing',
    ];
    if (body.status && !statusOrder.includes(body.status)) return next(400);

    const orderFound = await Order.findById(orderId);
    if (!orderFound) return resp.status(404).json({ message: 'La orden no existe' });
    const orderUpdate = await Order.findByIdAndUpdate(
      { _id: orderId },
      body,
      { new: true },
    );
    resp.status(200).json(orderUpdate);
  } catch (err) {
    next(404);
  }
};

// DELETE '/orders/:orderId'

const deleteOrder = async (req, resp, next) => {
  try {
    const { orderId } = req.params;
    if (!isObjectId(orderId)) return next(404);
    const orderFound = await Order.findById(orderId);
    if (!orderFound) return resp.status(404).json({ message: 'La orden no existe' });

    const findOrder = await Order.findOne({ _id: orderId });
    await Order.findByIdAndDelete(orderId);
    if (findOrder) {
      resp.status(200).json(findOrder);
    }
  } catch (err) {
    next(404);
  }
};

module.exports = {
  getOrders,
  getOneOrder,
  newOrder,
  updateOrder,
  deleteOrder,
};
