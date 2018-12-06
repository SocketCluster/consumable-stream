const MUST_OVERRIDE_METHOD_MESSAGE = 'Method must be overriden by subclass';

class AsyncIterableStream {
  next() {
    return this.createAsyncIterator().next();
  }

  createAsyncIterator() {
    throw new TypeError(MUST_OVERRIDE_METHOD_MESSAGE);
  }

  async once() {
    let result = await this.next();
    if (result.done) {
      // If stream was ended, this function should never resolve.
      await new Promise(() => {});
    }
    return result.value;
  }

  [Symbol.asyncIterator]() {
    return this.createAsyncIterator();
  }
}

module.exports = AsyncIterableStream;
