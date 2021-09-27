const User = require('../models/user');
const {
  pagination, validateUser, isAValidEmail, isAWeakPassword,
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
      return next(404);
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
    const { email, password } = req.body;
    if (!email || !password) {
      return next(400);
    }
    if (isAWeakPassword(password) || !isAValidEmail(email)) return next(400);
    const findUser = await User.findOne({ email: req.body.email });

    if (findUser) {
      return resp.status(403).json({
        message: '(Error) El usuario ya está registrado',
      });
    }

    const newUser = new User(req.body);

    const savedUser = await newUser.save(newUser);
    const user = await User.findOne({ _id: savedUser._id }).select('-password');
    return resp.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// PUT /users
const updateUser = async (req, resp, next) => {
  try {
    const { uid } = req.params;
    const { body } = req;

    const value = validateUser(uid);
    const user = await User.findOne(value);

    if (!user) return next(404);

    const checkIsAdmin = isAdmin(req);
    if (!checkIsAdmin && req.authToken.uid !== user._id.toString()) return resp.json({ message: 'No tiene autorizacion' });
    if (!checkIsAdmin && body.roles) return resp.json({ message: 'Requiere rol de administrador' });
    if (Object.entries(body).length === 0) return next(400);

    if (body.email && !isAValidEmail(body.email)) return next(400);
    if (body.password && isAWeakPassword(body.password)) return next(400);

    const updateUser = await User.findOneAndUpdate(
      value,
      { $set: body },
      { new: true, useFindAndModify: false },
    );

    return resp.status(200).json(updateUser);
  } catch (error) {
    next(404);
  }
};

// DELETE /users
const deleteOneUser = async (req, resp, next) => {
  try {
    const { uid } = req.params;

    const value = validateUser(uid);
    const deletedUser = await User.findOne(value);

    if (!deletedUser) return next(404);

    const checkIsAdmin = isAdmin(req);
    if (req.authToken.uid !== deletedUser._id.toString() || checkIsAdmin) {
      await User.findByIdAndDelete(value);
      return resp.status(200).send(deletedUser);
    }
    return next(403);
  } catch (error) {
    return next(404);
  }
};

module.exports = {
  getUsers, getOneUser, newUser, updateUser, deleteOneUser,
};
