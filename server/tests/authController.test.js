const assert = require('node:assert/strict');
const Module = require('node:module');
const { beforeEach, test } = require('node:test');

const serviceCalls = {
  register: [],
  login: [],
};

const authServiceMock = {
  async register(data) {
    serviceCalls.register.push(data);
    return { user: { id: 'test-user' } };
  },
  async login(data) {
    serviceCalls.login.push(data);
    return { user: { id: 'test-user' } };
  },
};

const authServicePath = require.resolve('../services/authService');
const authServiceModule = new Module(authServicePath);
authServiceModule.filename = authServicePath;
authServiceModule.loaded = true;
authServiceModule.exports = authServiceMock;
require.cache[authServicePath] = authServiceModule;

const { login, register } = require('../controllers/authController');

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

beforeEach(() => {
  serviceCalls.register.length = 0;
  serviceCalls.login.length = 0;
});

test('registration rejects missing, blank, and whitespace-only required fields', async () => {
  const invalidBodies = [
    undefined,
    {},
    { name: '   ', email: 'person@example.com', password: 'password8' },
    { name: 'Person', email: '   ', password: 'password8' },
    { name: 'Person', email: 'person@example.com', password: '' },
    { name: 'Person', email: 'person@example.com', password: '        ' },
    { name: 'Person', email: 'person@example.com', password: '1234567' },
  ];

  for (const body of invalidBodies) {
    const res = createResponse();
    await register({ body }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  }

  assert.equal(serviceCalls.register.length, 0);
});

test('registration trims name and email and accepts an eight-character password', async () => {
  const res = createResponse();

  await register({
    body: { name: '  Person  ', email: ' person@example.com ', password: '12345678' },
  }, res);

  assert.equal(res.statusCode, 201);
  assert.deepEqual(serviceCalls.register, [{
    name: 'Person',
    email: 'person@example.com',
    password: '12345678',
  }]);
});

test('login rejects missing, blank, and whitespace-only email or password', async () => {
  const invalidBodies = [
    undefined,
    {},
    { email: '   ', password: 'password8' },
    { email: 'person@example.com', password: '' },
    { email: 'person@example.com', password: '        ' },
  ];

  for (const body of invalidBodies) {
    const res = createResponse();
    await login({ body }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
  }

  assert.equal(serviceCalls.login.length, 0);
});

test('login trims email and leaves the password unchanged', async () => {
  const res = createResponse();

  await login({
    body: { email: ' person@example.com ', password: '  pass  ' },
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(serviceCalls.login, [{
    email: 'person@example.com',
    password: '  pass  ',
  }]);
});
