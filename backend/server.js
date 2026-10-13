const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Task = require('./module/task');
const User = require('./module/user');
const auth = require('./middleware/auth');
const { sendTaskCompletedEmail } = require('./utils/mailer');
const {
    validateCredentials,
    validateTask,
    validateCompleted,
} = require('./middleware/validate');

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

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

app.get('/tasks', auth, async(req, res) => {
    try {
        // Only this user's tasks.
        const tasks = await Task.find({ user: req.user.id });
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/tasks', auth, validateTask, async(req, res) => {
    try{
        const newtask = await Task.create({
            title : req.body.title,
            description : req.body.description,
            user : req.user.id });
        res.status(201).json(newtask);
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
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
