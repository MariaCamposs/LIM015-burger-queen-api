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
    if (isWeakPassword(password) || !isValidEmail(email)) return next(400);

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

// PUT /users/:uid
const updateUser = async (req, resp, next) => {
  try {
    const { uid } = req.params;
    let { body } = req;

    const validate = validateUser(uid);
    const userFind = await User.findOne(validate);
    console.log('obteniendo user' ,userFind)

    if (!userFind) {
      console.log('Usuario no encontrado')
      return resp.status(404).json('El usuario no existe');
    }

    if ((Object.keys(body).length === 0) || body.email === '' || body.password === '') {
      return resp.status(400).json('Ingrese email y/o password');
    }

    if ((req.authToken.id === userFind._id.toString()) || (await isAdmin(req))) {
      console.log('findByIdAndUpdate', userFind._id, body)
      const updateUser = await User.findByIdAndUpdate(
        { _id: userFind._id },
        body,
        { new: true});
        console.log('exito', updateUser)
      return resp.status(200).json(updateUser);
    }

    return next(403);
  } catch (err) {
    console.log(err, 'error')
    return next(404);
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
