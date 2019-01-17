class AsyncIterableStream {
  next(timeout) {
    return this.createAsyncIterator(timeout).next();
  }

  async once(timeout) {
    let result = await this.next(timeout);
    if (result.done) {
      // If stream was ended, this function should never resolve.
      await new Promise(() => {});
    }
    return result.value;
  }

  createAsyncIterator() {
    throw new TypeError('Method must be overriden by subclass');
  }

  createAsyncIterable(timeout) {
    let asyncIterator = this.createAsyncIterator(timeout);
    return {
      [Symbol.asyncIterator]: () => {
        return asyncIterator;
      }
    }
  }

  [Symbol.asyncIterator]() {
    return this.createAsyncIterator();
  }
}

module.exports = AsyncIterableStream;
