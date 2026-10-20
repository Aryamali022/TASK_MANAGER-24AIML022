const NodeCache = require('node-cache');

// One shared in-memory cache for the whole server.
//
// CACHE_TTL     - seconds an entry lives before it expires (default 60)
// CACHE_ENABLED - set to "false" to switch caching off, e.g. to measure the
//                 uncached response time without editing any code
const TTL = Number(process.env.CACHE_TTL) || 60;
const ENABLED = process.env.CACHE_ENABLED !== 'false';

const cache = new NodeCache({
  stdTTL: TTL,
  checkperiod: 120, // how often (s) expired entries are swept from memory
  // We only ever res.json() the cached value and never modify it, so there is
  // no need to deep-copy it on every get/set.
  useClones: false,
});

// Tasks belong to a user, so every key includes the user id. A single shared
// "all_tasks" key would serve one user's tasks to everybody else.
const keys = {
  allTasks: (userId) => `tasks:${userId}`,
  task: (userId, taskId) => `task:${userId}:${taskId}`,
};

const counters = { hits: 0, misses: 0 };

// Returns the cached value, or undefined on a miss (or when caching is off).
function get(key) {
  if (!ENABLED) return undefined;

  const value = cache.get(key);
  if (value === undefined) {
    counters.misses++;
  } else {
    counters.hits++;
  }
  return value;
}

function set(key, value) {
  if (ENABLED) cache.set(key, value);
}

// Called after every successful write so stale data is never served.
function invalidate(...keysToDelete) {
  cache.del(keysToDelete);
}

// Numbers for the GET /debug/cache endpoint.
function stats() {
  const total = counters.hits + counters.misses;
  return {
    enabled: ENABLED,
    ttlSeconds: TTL,
    hits: counters.hits,
    misses: counters.misses,
    hitRate: total === 0 ? '0%' : `${Math.round((counters.hits / total) * 100)}%`,
    keys: cache.keys(),
  };
}

function resetStats() {
  counters.hits = 0;
  counters.misses = 0;
}

module.exports = { keys, get, set, invalidate, stats, resetStats };
