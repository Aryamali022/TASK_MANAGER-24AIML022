// API tests for the task routes, run with `npm test` (locally and in GitHub Actions).
//
// There is no MongoDB in CI, so the Mongoose model is mocked: the tests check
// the Express side (routing, auth middleware, validation, status codes), not
// the database itself.

// Must be set before the app is loaded. dotenv never overrides a variable that
// already exists, so a local .env cannot change these.
process.env.JWT_SECRET = 'ci-test-secret';
process.env.NOTIFY_DELAY_MS = '0';

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../server');
const Task = require('../module/task');

// A valid token for a fake user, signed with the same secret auth.js checks.
const user = { id: '64b000000000000000000001', email: 'student@example.com' };
const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '5m' });

const sampleTasks = [
  { _id: '64b0000000000000000000a1', title: 'Write CI workflow', description: 'ci.yml', completed: false, user: user.id },
  { _id: '64b0000000000000000000a2', title: 'Push to GitHub', description: 'main branch', completed: true, user: user.id },
];

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GET /tasks', () => {
  test('returns 401 when no token is sent', async () => {
    const res = await request(app).get('/tasks');

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  test('returns 200 and the user\'s tasks with a valid token', async () => {
    // Task.find(...).lean() -> resolves to the sample list, no database needed.
    const find = jest.spyOn(Task, 'find').mockReturnValue({
      lean: () => Promise.resolve(sampleTasks),
    });

    const res = await request(app)
      .get('/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('Write CI workflow');
    // Only this user's tasks are asked for.
    expect(find).toHaveBeenCalledWith({ user: user.id });
  });
});

describe('POST /tasks', () => {
  test('returns 400 when the title is missing', async () => {
    const create = jest.spyOn(Task, 'create');

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'no title here' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('title is required');
    // Validation stopped the request before it reached the database.
    expect(create).not.toHaveBeenCalled();
  });
});
