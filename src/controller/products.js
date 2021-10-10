/* eslint-disable no-unused-vars */
const Product = require('../models/product');
const { pagination, isObjectId } = require('../services/services');
const { isAdmin } = require('../middleware/auth');

// GET /products

const getProducts = async (req, resp, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: { _id: -1 },
    };
    const products = await Product.paginate({}, options);
    const url = `${req.protocol}://${req.get('host') + req.path}`;
    const links = pagination(products, url, options.page, options.limit, products.totalPages);

    resp.links(links);
    return resp.status(200).json(products.docs);
  } catch (error) {
    return next(error);
  }
};

// GET/products/:uid
const getOneProduct = async (req, resp, next) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) return next(404);

    const product = await Product.findOne({ _id: productId });
    if (!product) return next(404);
    return resp.status(200).json(product);
  } catch (error) {
    return next(error);
  }
};

// POST /products
const newProduct = async (req, resp, next) => {
  try {
    const {
      name, price, image, type,
    } = req.body;
    if (!name || !price) {
      return next(400);
    }
    if (Object.entries(req.body).length === 0) {
      return resp.status(400).json({
        message: 'Body vacío',
      });
    }

    const createProduct = new Product(req.body);
    const savedProduct = await createProduct.save();
    const product = await Product.findOne({ _id: savedProduct._id });
    resp.status(200).json(product);
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, resp, next) => {
  try {
    const { productId } = req.params;
    const { body } = req;
    if (!isObjectId(productId)) return resp.status(404).json({ message: 'El formato del Id no es correcto' });
    if (Object.entries(body).length === 0) return next(400);
    if (!isAdmin(req)) return next(403);

    const productFound = await Product.findById(productId);
    if (body.price && typeof body.price !== 'number') return resp.status(400).json({ message: 'El precio debe ser un numero' });
    if (!productFound) return resp.status(404).json({ message: 'El producto no existe' });
    const productUpdate = await Product.findOneAndUpdate(
      { _id: req.params.productId },
      { $set: req.body },
      { new: true, useFindAndModify: false },
    );
    resp.status(200).json(productUpdate);
  } catch (err) {
    next(404);
  }
};

// DELETE '/products/:productId'

const deleteProduct = async (req, resp, next) => {
  try {
    if (!isAdmin(req)) return next(403);

    const productDeleted = await Product.findOne({ _id: req.params.productId });
    await Product.findByIdAndDelete({ _id: req.params.productId });
    if (productDeleted) {
      resp.status(200).json(productDeleted);
    }
    resp.status(400).json({ message: 'El producto que quiere eliminar no existe' });
  } catch (err) {
    next(404);
  }
};

module.exports = {
  getProducts,
  getOneProduct,
  newProduct,
  updateProduct,
  deleteProduct,
};
