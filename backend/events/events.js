const EventEmitter = require('events');

// One shared emitter for task events. Routes emit, events/listeners.js listens.
//
// captureRejections: listeners are async functions, so an error thrown inside
// one becomes a rejected promise. With this option Node passes that rejection
// to the 'error' event instead of leaving it unhandled.
class TaskEvents extends EventEmitter {}

module.exports = new TaskEvents({ captureRejections: true });
