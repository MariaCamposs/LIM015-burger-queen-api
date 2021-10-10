const supertest = require('supertest');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const app = require('../../app');
const { connect, close } = require('../../database');

const databaseName = 'test';

const adminUser = {
  email: 'admin@test.com',
  password: 'userTest1',
};

beforeAll(async () => {
  await connect(`mongodb://127.0.0.1/${databaseName}`);

  const addUser = (user, admin = false) => User.findOne({ email: user.email })
    .then(async (doc) => {
      // Crear usuario
      const auth = new User({
        email: user.email,
        password: bcrypt.hashSync(user.password, 10),
        roles: { admin },
      });
      if (!doc) await auth.save();
    });
  await addUser(adminUser, true);
});

afterAll(async () => {
  await close();
});

describe('POST /auth', () => {
  it('Should respond 400 for empty body', (done) => {
    supertest(app)
      .post('/auth')
      .send({})
      .expect(400, done);
  });
  it('Should 404 if the user does not exist', (done) => {
    supertest(app)
      .post('/auth')
      .send({ email: 'Test@gmail.com', password: 'User12345' })
      .expect(404, done);
  });
  it('Should respond 404 for invalid password', (done) => {
    supertest(app)
      .post('/auth')
      .send({ email: adminUser.email, password: 'Test.1234' })
      .expect(404, done);
  });
  it('Should respond 200 and return a token', (done) => {
    supertest(app)
      .post('/auth')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(200)
      .then((res) => {
        expect(res.body.token).toBeTruthy();
        done();
      });
  });
});
