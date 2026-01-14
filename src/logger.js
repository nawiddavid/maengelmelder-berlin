export function log(scope, message, payload) {
  if (payload) {
    console.log(`[${scope}] ${message}`, payload);
    return;
  }

  console.log(`[${scope}] ${message}`);
}

export function logError(scope, error) {
  console.error(`[${scope}] ${error.message}`, {
    stack: error.stack,
  });
}

