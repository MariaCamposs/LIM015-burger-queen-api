const request = require('supertest');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const app = require('../../app');
const { connect, close } = require('../../database');

const databaseName = 'testUsers';

const adminUser = {
  email: 'admin@test.com',
  password: 'userTest1',
};
let adminToken = null;

const testUser = {
  email: 'user@test.com',
  password: 'userTest2',
};
let testToken = null;
let idUser = null;

beforeAll(async () => {
  await connect(`mongodb://127.0.0.1/${databaseName}`);
  const addUser = (user, admin = false) => User.findOne({ email: user.email })
    .then(async (doc) => {
      const auth = new User({
        email: user.email,
        password: bcrypt.hashSync(user.password, 10),
        roles: { admin },
      });
      if (!doc) await auth.save();
    });
  await addUser(adminUser, true);
  await addUser(testUser, false);
});

afterAll(async () => {
  await close();
});

describe('POST /users', () => {
  it('should return 400 when email and password are missing', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/users').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(400)
        .then((response) => {
          expect(response.body.message).toBe('Debe ingresar email o contraseña');
          done();
        });
    });
  });
  it('should return 400 when invalid email', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/users').set('Authorization', `Bearer ${token}`)
        .send({ email: 'user@test', password: '12345678' })
        .expect('Content-Type', /json/)
        .expect(400)
        .then((response) => {
          expect(response.body.message).toBe('Email o contraseña invalida');
          done();
        });
    });
  });
  it('should return 400 when invalid password', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/users').set('Authorization', `Bearer ${token}`)
        .send({ email: 'user@test.com', password: '123' })
        .expect('Content-Type', /json/)
        .expect(400)
        .then((response) => {
          expect(response.body.message).toBe('Email o contraseña invalida');
          done();
        });
    });
  });
  it('should return 403 when user is already registered', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/users').set('Authorization', `Bearer ${token}`)
        .send(adminUser)
        .expect('Content-Type', /json/)
        .expect(403)
        .then((response) => {
          expect(response.body.message).toBe('(Error) El usuario ya está registrado');
          done();
        });
    });
  });
  it('should return 200 and create new admin user as admin', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/users').set('Authorization', `Bearer ${token}`)
        .send({ email: 'adminNew@test.com', password: 'newuserTest1', roles: { admin: true } })
        .expect('Content-Type', /application\/json/)
        .expect(200)
        .then((response) => {
          expect(response.body.email).toBeTruthy();
          expect(response.body.password).toBeTruthy();
          expect(response.body._id).toBeTruthy();
          done();
        });
    });
  });
});

describe('GET /users', () => {
  it('should return 401 when not auth', (done) => {
    request(app)
      .get('/users')
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('Should return 403 when no Admin', (done) => {
    request(app)
      .post('/auth')
      .send(testUser)
      .then((resp) => {
        testToken = resp.body.token;
        request(app)
          .get('/users')
          .set('Authorization', `bearer ${testToken}`)
          .expect('Content-Type', /application\/json/)
          .expect(403, done);
      });
  });
  it('Should return 200 and list of users', (done) => {
    request(app)
      .post('/auth')
      .send(adminUser)
      .expect(200)
      .then(((resp) => {
        adminToken = resp.body.token;
        request(app)
          .get('/users')
          .set('Authorization', `bearer ${adminToken}`)
          .expect('Content-Type', /application\/json/)
          .expect(200)
          .then(({ headers, body }) => {
            expect(headers.link).toBeTruthy();
            expect(body.length > 0).toBe(true);
            expect(Array.isArray(body)).toBe(true);
            done();
          });
      }));
  });
});

describe('GET /users/:uid', () => {
  it('should return 401 when not auth', (done) => {
    request(app)
      .get(`/users/${adminUser.email}`)
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('should return 404 when id or email format are wrong', (done) => {
    request(app)
      .get('/users/test@user')
      .set('Authorization', `bearer ${adminToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(404, done);
  });
  it('should return 404 when not found', (done) => {
    request(app)
      .get('/users/user@test.test')
      .set('Authorization', `bearer ${adminToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(404, done);
  });
  it('should return 403 when not owner or admin', (done) => {
    request(app)
      .post('/auth')
      .send(testUser)
      .then((resp) => {
        testToken = resp.body.token;
        request(app)
          .get(`/users/${adminUser.email}`)
          .set('Authorization', `bearer ${testToken}`)
          .expect('Content-Type', /application\/json/)
          .expect(403, done);
      });
  });
  it('should return 200 and own user by email', (done) => {
    request(app)
      .get(`/users/${testUser.email}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send(testUser)
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .then((response) => {
        idUser = response.body._id;
        expect(typeof response.body.email).toBe('string');
        expect(typeof response.body._id).toBe('string');
        expect(response.body.roles.admin).not.toBeTruthy();
        expect(typeof response.password).toBe('undefined');
        done();
      });
  });
  it('should return 200 and other user as admin', (done) => {
    request(app)
      .get(`/users/${testUser.email}`)
      .set('Authorization', `bearer ${adminToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .then(({ body }) => {
        expect(body.email).toBe(testUser.email);
        done();
      });
  });
});

describe('PUT /users/:uid', () => {
  it('should return 401 when no auth', (done) => {
    request(app)
      .put(`/users/${testUser.email}`)
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('should return 403 when not owner or admin', (done) => {
    request(app)
      .put(`/users/${adminUser.email}`)
      .set('Authorization', `bearer ${testToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(403, done);
  });
  it('should return 403 when a non-admin user tries to change role', (done) => {
    request(app)
      .put(`/users/${testUser.email}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ roles: { admin: true } })
      .expect('Content-Type', /application\/json/)
      .expect(403, done);
  });
  it('should return 404 when user not found', (done) => {
    request(app)
      .put('/users/test@a.com')
      .set('Authorization', `bearer ${adminToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(404, done);
  });
  it('should return 400 when there are no properties in the body', (done) => {
    request(app)
      .put(`/users/${adminUser.email}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(400, done);
  });
  it('should return 400 when password format is wrong', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).put(`/users/${idUser}`).set('Authorization', `Bearer ${token}`)
        .send({ password: '123' })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });
  it('should return 400 when email format is wrong', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).put(`/users/${testUser.email}`).set('Authorization', `Bearer ${token}`)
        .send({ email: 'm' })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });
  it('should return 200 and update user', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).put(`/users/${testUser.email}`).set('Authorization', `Bearer ${token}`)
        .send({ email: 'myuser@test.com' })
        .expect('Content-Type', /application\/json/)
        .then((response) => {
          expect(typeof response.body.email).toBeTruthy();
          expect(typeof response.body.roles).toBeTruthy();
          expect(typeof response.password).toBeTruthy();
          done();
        });
    });
  });
});

describe('DELETE /users/:uid', () => {
  it('should return 401 when no auth', (done) => {
    request(app)
      .delete(`/users/${testUser.email}`)
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('should return 403 when not owner or admin', (done) => {
    request(app).post('/auth').send(`${testUser.email}`).then((response) => {
      const { token } = response.body;
      request(app).delete(`/users/${adminUser.email}`).set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(403, done);
    });
  });
  it('should return 404 when user not found', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).delete('/users/user@fail.com').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
  it('should return 200 and delete user', (done) => {
    request(app)
      .delete(`/users/${idUser}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .then(({ body }) => {
        expect(typeof body.email).toBe('string');
        expect(typeof body._id).toBe('string');
        done();
      });
  });
  it('should return 200 and delete user', (done) => {
    request(app)
      .delete('/users/adminNew@test.com')
      .set('Authorization', `bearer ${adminToken}`)
      .expect('Content-Type', /application\/json/)
      .expect(200)
      .then(({ body }) => {
        expect(typeof body.email).toBe('string');
        expect(typeof body._id).toBe('string');
        done();
      });
  });
});
