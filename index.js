class AsyncIterableStream {
  createAsyncIterator() {
    throw new TypeError('Method must be overriden by subclass');
  }

  next() {
    return this.createAsyncIterator().next();
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
