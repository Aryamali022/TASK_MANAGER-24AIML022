// Load .env first: utils/cache.js reads CACHE_TTL / CACHE_ENABLED as soon as
// it is required.
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Task = require('./module/task');
const User = require('./module/user');
const auth = require('./middleware/auth');
const cache = require('./utils/cache');
const { sendTaskCompletedEmail } = require('./utils/mailer');
const taskEvents = require('./events/events');
require('./events/listeners'); // registers the task-created / task-deleted handlers
const {
    validateCredentials,
    validateTask,
    validateCompleted,
} = require('./middleware/validate');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

/* =========================================================================
   AUTH ROUTES  (public - no token needed to reach these)
   ========================================================================= */

// POST /register -> hash password -> save User -> 201
app.post('/register', validateCredentials, async(req, res) => {
    const { email, password } = req.body;
    try {
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Email already registered' });
        }

        // 12 = "cost factor". Higher is slower to crack but slower to log in.
        const hash = await bcrypt.hash(password, 12);

        const user = await User.create({ email, password: hash });

        // Never send the password hash back to the browser.
        res.status(201).json({ id: user._id, email: user.email });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /login -> verify password -> sign JWT -> return token
app.post('/login', validateCredentials, async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        // Compare the typed password against the stored hash.
        // Note: the same vague message is used whether the email or the
        // password was wrong, so nobody can probe which emails exist.
        const passwordOk = user && await bcrypt.compare(password, user.password);
        if (!passwordOk) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },   // payload (public - do not put secrets here)
            process.env.JWT_SECRET,                // signature key
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        );

        res.status(200).json({ token, email: user.email });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* =========================================================================
   TASK ROUTES  (protected - "auth" runs first on every one of them)
   ========================================================================= */

// GET /tasks -> cache check -> HIT: return cached list
//                           -> MISS: query MongoDB, store in cache, return
// The X-Cache header shows which one happened (visible in Postman).
app.get('/tasks', auth, async(req, res) => {
    const key = cache.keys.allTasks(req.user.id);
    try {
        const cached = cache.get(key);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.status(200).json(cached);
        }

        // Only this user's tasks. lean() returns plain objects, which are
        // cheaper to build and safe to keep in the cache.
        const tasks = await Task.find({ user: req.user.id }).lean();
        cache.set(key, tasks);

        res.set('X-Cache', 'MISS');
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /tasks/:id -> same idea, cached under its own key per task.
app.get('/tasks/:id', auth, async(req, res) => {
    const key = cache.keys.task(req.user.id, req.params.id);
    try {
        const cached = cache.get(key);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.status(200).json(cached);
        }

        const task = await Task.findOne({ _id: req.params.id, user: req.user.id }).lean();
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        cache.set(key, task);

        res.set('X-Cache', 'MISS');
        res.status(200).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.post('/tasks', auth, validateTask, async(req, res) => {
    try{
        const newtask = await Task.create({
            title : req.body.title,
            description : req.body.description,
            user : req.user.id });
        // The list changed, so the cached list is now stale.
        cache.invalidate(cache.keys.allTasks(req.user.id));
        res.status(201).json(newtask);
        console.log(`[API] Response sent at ${new Date().toISOString()}`);

        // The notification runs in the background (events/listeners.js);
        // emit() returns straight away and does not wait for it.
        taskEvents.emit('task-created', {
            task: newtask,
            user: req.user,
            emittedAt: Date.now(),
        });
        console.log(`[API] task-created emitted, route finished at ${new Date().toISOString()}`);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/tasks/:id', auth, validateCompleted, async(req, res) => {
    const { completed } = req.body;
    try {
        // The user filter means you cannot update someone else's task,
        // even if you guess its id.
        const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Only email on the change "not done" -> "done", not on every save.
        const justCompleted = completed && !task.completed;

        task.completed = completed;
        await task.save();

        // Both the list and this task's own entry are now stale.
        cache.invalidate(
            cache.keys.allTasks(req.user.id),
            cache.keys.task(req.user.id, task._id),
        );

        res.status(200).json(task);

        // Sent after the response so the user is not kept waiting on SMTP.
        // The address comes from the JWT, i.e. the logged-in user's own email.
        if (justCompleted) {
            sendTaskCompletedEmail(req.user.email, task);
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/tasks/:id', auth, async(req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id,
        });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        cache.invalidate(
            cache.keys.allTasks(req.user.id),
            cache.keys.task(req.user.id, task._id),
        );
        res.status(200).json({ message: 'Task deleted successfully' });
        console.log(`[API] Response sent at ${new Date().toISOString()}`);

        taskEvents.emit('task-deleted', {
            task,
            user: req.user,
            emittedAt: Date.now(),
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

/* =========================================================================
   DEBUG  (cache statistics - counts and key names only, no task data)
   ========================================================================= */

// GET /debug/cache -> hits, misses, hit rate, TTL and the keys in memory
app.get('/debug/cache', (req, res) => {
    res.status(200).json(cache.stats());
});

// DELETE /debug/cache -> reset the hit/miss counters before a new experiment
app.delete('/debug/cache', (req, res) => {
    cache.resetStats();
    res.status(200).json(cache.stats());
});

// Only connect to MongoDB and open the port when started with `node server.js`.
// When a test file does require('./server'), it just gets the app back, so
// supertest can call the routes without a real database or a busy port.
if (require.main === module) {
    mongoose.connect(process.env.MONGO_URI, {})
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err);
        });

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
