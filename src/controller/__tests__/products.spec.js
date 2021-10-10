const request = require('supertest');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const app = require('../../app');
const { connect, close } = require('../../database');

const database = 'testProducts';

const adminUser = {
  email: 'products@test.com',
  password: 'Products@test123',
};

const testUser = {
  email: 'user@products.com', password: 'User@test123',
};

beforeAll(async () => {
  await connect(`mongodb://127.0.0.1/${database}`);
  const addUser = (user, admin = false) => User.findOne({ email: user.email })
    .then(async (doc) => {
      const adminAuth = new User({
        email: user.email,
        password: bcrypt.hashSync(user.password, 10),
        roles: { admin },
      });
      if (!doc) await adminAuth.save();
    });
  await addUser(adminUser, true);
  await addUser(testUser);
});

afterAll(async () => {
  await close();
});

const productOne = { name: 'Hamburguesa', price: 5 };

describe('POST/products', () => {
  it('should return 200  when a new product was created', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/products').set('Authorization', `Bearer ${token}`)
        .send(productOne)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(response.body.name).toBeTruthy();
          expect(response.body.price).toBeTruthy();
          expect(response.body._id).toBeTruthy();
          done();
        });
    });
  });
  it('should return 400 when name or price is missing', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/products').set('Authorization', `Bearer ${token}`)
        .send({ name: 'algo' })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });
  it('should return 401 when no auth', (done) => {
    request(app)
      .post('/products')
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('should return 403 is not admin', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).post('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(403, done);
    });
  });
});

describe('GET/products', () => {
  it('should return all Products', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBeTruthy();
          done();
        });
    });
  });
  it('should return all Products when is not admin', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBeTruthy();
          done();
        });
    });
  });
  it('should return an error 403 when is not autenticated', (done) => {
    request(app).get('/products').set('Authorization', 'Bearer 1dfg5645fg454g')
      .expect('Content-Type', /json/)
      .expect(403)
      .then((response) => {
        expect(response.body.message).toEqual('Forbidden');
        done();
      });
  });
});

describe('GET/products:productId', () => {
  it('should return a product by Id', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).get(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
              expect(response.body.name).toBeTruthy();
              expect(response.body.price).toBeTruthy();
              expect(response.body._id).toBeTruthy();
              done();
            });
        });
    });
  });
  it('should return a product by Id when is not admin', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).get(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
              expect(response.body.name).toBeTruthy();
              expect(response.body.price).toBeTruthy();
              expect(response.body._id).toBeTruthy();
              done();
            });
        });
    });
  });
  it('should return 404 when product doesn`t exists', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products/user@fail.com').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
});

describe('PUT/products:productId', () => {
  it('should return 404 when productId does not exits', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).put('/products/user@fail.com').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404)
        .then((response) => {
          expect(response.body).toEqual({ message: 'El formato del Id no es correcto' });
          done();
        });
    });
  });
  it('should return 403 when is not admin', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).put(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .expect('Content-Type', /json/)
            .expect(403)
            .then((response) => {
              expect(response.body.message).toEqual('Forbidden');
              done();
            });
        });
    });
  });
  it('should return 400 when typeof of price is not number', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).put(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .send({ price: 'a' })
            .expect('Content-Type', /json/)
            .expect(400)
            .then((response) => {
              expect(response.body).toEqual({ message: 'El precio debe ser un numero' });
              done();
            });
        });
    });
  });
  it('should return 200 when product is updated', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).put(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .send({ price: 5 })
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
              expect(response.body._id).toBeTruthy();
              expect(response.body.name).toBeTruthy();
              expect(response.body.price).toBe(5);
              done();
            });
        });
    });
  });
  it('should return 400 when properties not found', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).put(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .send({})
            .expect('Content-Type', /json/)
            .expect(400, done);
        });
    });
  });
});

describe('DELETE/products:productId', () => {
  it('should return 403 when is not admin', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).delete(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .expect('Content-Type', /json/)
            .expect(403)
            .then((response) => {
              expect(response.body.message).toEqual('Forbidden');
              done();
            });
        });
    });
  });
  it('should return 404 when product does not exits', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).delete('/products/algo').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
  it('should return 200 when product was deleted', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/products').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          request(app).delete(`/products/${(response.body[0])._id}`).set('Authorization', `Bearer ${token}`)
            .expect('Content-Type', /json/)
            .expect(200)
            .then((response) => {
              expect(response.body.name).toBeTruthy();
              expect(response.body.price).toBeTruthy();
              expect(response.body._id).toBeTruthy();
              done();
            });
        });
    });
  });
});
