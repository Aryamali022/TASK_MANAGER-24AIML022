const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
},
  description: {
    type: String,
    required: true,
},
completed: {
      type: Boolean,
      default: false,
},
// Which user this task belongs to. Filled in from the JWT, never from the
// request body, so nobody can create a task in someone else's account.
user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
},
createdat: {
    type : Date ,
    default: Date.now,
},
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
