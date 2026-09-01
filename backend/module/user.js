const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,     // MongoDB will reject a second user with the same email
    lowercase: true,  // "Arya@x.com" and "arya@x.com" are the same account
    trim: true,
  },
  // This NEVER stores the real password - only the bcrypt hash of it.
  password: {
    type: String,
    required: true,
  },
  createdat: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
