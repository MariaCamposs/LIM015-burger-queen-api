const request = require('supertest');
const bcrypt = require('bcrypt');
const User = require('../../models/user');
const Product = require('../../models/product');
const app = require('../../app');
const { connect, close } = require('../../database');

const database = 'testOrders';

const adminUser = { email: 'orders@test.com', password: 'Orders@test123' };

const testUser = { email: 'test@orders.com', password: 'myuser' };

const productOne = { name: 'Hamburguesa', price: 5 };

const orderOne = {
  userId: '',
  client: '',
  products: [
    { qty: 0, productId: '' },
  ],
};
let orderOneId = null;

beforeAll(async () => {
  await connect(`mongodb://127.0.0.1/${database}`);
  const addUser = (user, admin = false) => User.findOne({ email: user.email })
    .then(async (doc) => {
      const auth = new User({
        email: user.email,
        password: bcrypt.hashSync(user.password, 10),
        roles: { admin },
      });
      // eslint-disable-next-line no-param-reassign
      user._id = auth._id.toString();
      if (!doc) await auth.save();
    });
  await addUser(adminUser, true);
  await addUser(testUser);
  const addProduct = async (product) => {
    const newProduct = new Product({ name: product.name, price: product.price });
    // eslint-disable-next-line no-param-reassign
    product._id = newProduct._id.toString();
    await newProduct.save();
  };
  await addProduct(productOne);
  orderOne.userId = testUser._id;
  orderOne.client = 'client';
  orderOne.products = [
    { qty: 2, productId: productOne._id },
  ];
});

afterAll(async () => {
  await close();
});

describe('POST/orders', () => {
  it('Post order', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/orders').set('Authorization', `Bearer ${token}`)
        .send(orderOne)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          orderOneId = response.body._id;
          expect(response.body.client).toBeTruthy();
          expect(response.body.products).toBeTruthy();
          expect(response.body._id).toBeTruthy();
          done();
        });
    });
  });
  it('should return 401 when no auth', (done) => {
    request(app)
      .post('/orders')
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('Should return 404 when one product does not exits', (done) => {
    const orderFail = {
      client: 'Raul',
      userId: '715v844f8b07cb498f9a647a',
      products: [
        { productId: 'fail' },
      ],
    };
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).post('/orders').set('Authorization', `Bearer ${token}`)
        .send(orderFail)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
});

describe('GET/orders', () => {
  it('should return 401 when no auth', (done) => {
    request(app)
      .get('/orders')
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('should return all Orders', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/orders').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBeTruthy();
          done();
        });
    });
  });
  it('should return all Orders when is not admin', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).get('/orders').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBeTruthy();
          done();
        });
    });
  });
  it('should return an error 403 when is not autenticated', (done) => {
    request(app).get('/orders').set('Authorization', 'Bearer 13656487weadvsyv')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });
});

describe('GET/orders:orderId', () => {
  it('should return 401 when no auth', (done) => {
    request(app)
      .get('/orders/orders')
      .expect('Content-Type', /application\/json/)
      .expect(401, done);
  });
  it('should return a order by Id', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get(`/orders/${orderOneId}`).set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(response.body.userId).toBe(orderOne.userId);
          expect(response.body.client).toBe(orderOne.client);
          expect(Array.isArray(response.body.products)).toBe(true);
          done();
        });
    });
  });
  it('should return a order by Id', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).get(`/orders/${orderOneId}`).set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(response.body.userId).toBe(orderOne.userId);
          expect(response.body.client).toBe(orderOne.client);
          expect(Array.isArray(response.body.products)).toBe(true);
          done();
        });
    });
  });
  it('should return 404 when order doesn`t exists', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/orders/fail').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
  it('should return 404 when id format is wrong', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/orders/fail').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /application\/json/)
        .expect(404, done);
    });
  });
});

describe('PUT/orders:orderId', () => {
  it('should return 404 when orderId does not exits', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).put('/orders/myorder').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
  it('should return 400 when invalid status', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).put(`/orders/${orderOneId}`).set('Authorization', `Bearer ${token}`)
        .send({ status: 'fail' })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });
  it('should return 404 when product does not exits', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/orders').set('Authorization', `Bearer ${token}`);
      const order = response.body._id;
      request(app).put(`/orders/${order}`).set('Authorization', `Bearer ${token}`)
        .send({
          products: [
            { productId: 'fail' },
          ],
        })
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
  it('should return 200 when product is updated', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).get('/orders').set('Authorization', `Bearer ${token}`);
      request(app).put(`/orders/${orderOneId}`).set('Authorization', `Bearer ${token}`)
        .send({ status: 'delivering' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(response.body._id).toBeTruthy();
          expect(response.body.client).toBeTruthy();
          expect(response.body.products).toBeTruthy();
          expect(response.body.status).toBe('delivering');
          done();
        });
    });
  });
  it('should return 400 when properties not found', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).put(`/orders/${orderOneId}`).set('Authorization', `Bearer ${token}`)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400, done);
    });
  });
});

describe('DELETE/orders:orderId', () => {
  it('should return 404 when order does not exits', (done) => {
    request(app).post('/auth').send(testUser).then((response) => {
      const { token } = response.body;
      request(app).delete('/orders/fail').set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });
  });
  it('should return 200 when order was deleted', (done) => {
    request(app).post('/auth').send(adminUser).then((response) => {
      const { token } = response.body;
      request(app).delete(`/orders/${orderOneId}`).set('Authorization', `Bearer ${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          expect(response.body.client).toBeTruthy();
          expect(response.body.products).toBeTruthy();
          expect(response.body.status).toBeTruthy();
          expect(response.body.userId).toBeTruthy();
          done();
        });
    });
  });
});
