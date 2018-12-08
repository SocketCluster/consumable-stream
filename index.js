class AsyncIterableStream {
  createAsyncIterator() {
    throw new TypeError('Method must be overriden by subclass');
  }

  next() {
    return this.createAsyncIterator().next();
  }

  async _once() {
    let result = await this.next();
    if (result.done) {
      // If stream was ended, this function should never resolve.
      await new Promise(() => {});
    }
    return result.value;
  }

  async once(timeout) {
    if (timeout === undefined) {
      return this._once();
    }
    let delay = wait(timeout);
    return Promise.race([
      (async () => {
        await delay.promise;
        let error = new Error('The once promise timed out');
        error.name = 'TimeoutError';
        throw error;
      })(),
      (async () => {
        let value = await this._once();
        clearTimeout(delay.id);
        return value;
      })()
    ]);
  }

  [Symbol.asyncIterator]() {
    return this.createAsyncIterator();
  }
}

function wait(timeout) {
  let id;
  let promise = new Promise((resolve) => {
    id = setTimeout(() => {
      resolve();
    }, timeout);
  });
  return {id, promise};
}

module.exports = AsyncIterableStream;
