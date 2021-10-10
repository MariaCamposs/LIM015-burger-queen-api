/* eslint-disable max-len */
const User = require('../models/user');
const {
  pagination, validateUser, isValidEmail, isWeakPassword,
} = require('../services/services');
const { isAdmin } = require('../middleware/auth');

// GET /users

const getUsers = async (req, resp, next) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sort: { _id: -1 },
    };
    const users = await User.paginate({}, options);
    const url = `${req.protocol}://${req.get('host') + req.path}`;
    const links = pagination(users, url, options.page, options.limit, users.totalPages);

    resp.links(links);
    return resp.status(200).json(users.docs);
  } catch (error) {
    return next(error);
  }
};

// GET /user/:uid
const getOneUser = async (req, resp, next) => {
  try {
    const { uid } = req.params;

    const value = validateUser(uid);
    const findUser = await User.findOne(value);
    if (!findUser) {
      return resp.status(404).json({ message: 'id o email invalido' });
    }
    const checkIsAdmin = await isAdmin(req);
    if (req.authToken.uid === findUser._id.toString() || checkIsAdmin) {
      return resp.status(200).json(findUser);
    }
    return next(403);
  } catch (error) {
    return next(error);
  }
};

// POST /users
const newUser = async (req, resp, next) => {
  try {
    const { email, password, roles } = req.body;

    if (!email || !password) {
      return resp.status(400).json({ message: 'Debe ingresar email o contraseña' });
    }
    if (isWeakPassword(password) || !isValidEmail(email)) {
      return resp.status(400).json({ message: 'Email o contraseña invalida' });
    }

    const findUser = await User.findOne({ email: req.body.email });

    if (findUser) {
      return resp.status(403).json({
        message: '(Error) El usuario ya está registrado',
      });
    }

    const newUser = new User({
      email,
      password: await User.encryptPassword(password),
      roles,
    });

    const savedUser = await newUser.save(newUser);
    return resp.status(200).json(savedUser);
  } catch (error) {
    next(error);
  }
};

// PUT /users/:uid
const updateUser = async (req, resp, next) => {
  try {
    const { uid } = req.params;
    const { body } = req;

    const value = validateUser(uid);

    const userFind = await User.findOne(value);

    if (!userFind) return next(404);

    if (req.authToken.uid !== userFind._id.toString() && !isAdmin(req)) return next(403);
    if (!isAdmin(req) && body.roles) return next(403);
    if (Object.entries(body).length === 0) {
      return resp.status(400).json('Ingrese email y/o password para actualizar');
    }

    if (body.password && isWeakPassword(body.password)) return next(400);

    if (body.email && !isValidEmail(body.email)) return next(400);

    const updateUser = await User.findByIdAndUpdate(
      { _id: userFind._id },
      req.body,
      { new: true },
    );
    return resp.status(200).json(updateUser);
  } catch (err) {
    console.info('error users', err);
    return next(404);
  }
};

// DELETE /users
const deleteOneUser = async (req, resp, next) => {
  try {
    const { uid } = req.params;

    const value = validateUser(uid);
    const user = await User.findOne(value);

    const checkIsAdmin = await isAdmin(req);
    if (req.authToken.uid !== user._id.toString() && !checkIsAdmin) {
      return resp.status(403).json('Debe tener rol de administrador');
    }

    if (!user) {
      console.info('usuario delele no existe');
      return resp.status(404).json({ message: `El usuario ${uid} no existe` });
    }

    if (req.authToken.uid === user._id.toString() || checkIsAdmin) {
      await User.findByIdAndDelete({ _id: user._id });
      return resp.status(200).send(user);
    }
  } catch (error) {
    return next(404);
  }
};

module.exports = {
  getUsers, getOneUser, newUser, updateUser, deleteOneUser,
};
