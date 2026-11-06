// Register before first rendering, including the incoming pagereveal event.
// A skipped animation must never become an unhandled rejection.
for (const name of ['pageswap', 'pagereveal']) {
  addEventListener(name, event => {
    event.viewTransition?.ready.catch(() => {});
  });
}
