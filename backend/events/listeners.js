const { setImmediate: nextTick, setTimeout: sleep } = require('timers/promises');
const taskEvents = require('./events');

// NOTIFY_DELAY_MS       - fake "slow" work in the task-created handler, so the
//                         gap between response and notification is visible
// NOTIFY_SIMULATE_ERROR - set to "true" to make the handler throw, to test the
//                         'error' listener
const DELAY_MS = Number(process.env.NOTIFY_DELAY_MS) || 0;
const SIMULATE_ERROR = process.env.NOTIFY_SIMULATE_ERROR === 'true';

const now = () => new Date().toISOString();
const since = (start) => `+${Date.now() - start} ms after emit`;

// emit() calls listeners synchronously, inside the route. Awaiting
// setImmediate first ends that synchronous part, so emit() returns at once and
// the rest of the handler runs on a later turn of the event loop.
taskEvents.on('task-created', async ({ task, user, emittedAt }) => {
  await nextTick();
  console.log(`[Notification] handler started at ${now()} (${since(emittedAt)})`);

  if (DELAY_MS) {
    // setTimeout waits without blocking: other requests are served meanwhile.
    await sleep(DELAY_MS);
  }

  if (SIMULATE_ERROR) {
    throw new Error(`Simulated failure while notifying about "${task.title}"`);
  }

  console.log(
    `[Notification] Task "${task.title}" created for ${user.email} (${user.id}) ` +
    `- logged at ${now()} (${since(emittedAt)})`,
  );
});

taskEvents.on('task-deleted', async ({ task, user, emittedAt }) => {
  await nextTick();
  console.log(
    `[Notification] Task "${task.title}" was deleted by ${user.email} ` +
    `- logged at ${now()} (${since(emittedAt)})`,
  );
});

// Receives errors from the async listeners above (see captureRejections in
// events.js). Without an 'error' listener Node would crash the server.
taskEvents.on('error', (err) => {
  console.error(`[Notification error] ${now()} - ${err.message}`);
});
