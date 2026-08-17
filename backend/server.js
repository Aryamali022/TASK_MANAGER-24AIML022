const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('./module/task');

dotenv.config();

const app = express();

const PORT = 5000;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

app.get('/tasks', async(req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/tasks', async(req, res) => {
    const { title, description } = req.body;
    try{
        const newtask = await Task.create({ 
            title : req.body.title, 
            description : req.body.description });
        res.status(201).json(newtask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/tasks/:id', async(req, res) => {
    const { completed } = req.body;
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, { completed }, { new: true });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/tasks/:id', async(req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
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