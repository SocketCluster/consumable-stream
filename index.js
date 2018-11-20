class AsyncIterableStream {
  constructor(asyncIteratorFactory) {
    this._asyncIteratorFactory = asyncIteratorFactory;
  }

  next() {
    return this._asyncIteratorFactory().next();
  }

  async once() {
    while (true) {
      let result = await this.next();
      if (result.done) {
        // If stream was ended, this function should never resolve.
        await new Promise(() => {});
      }
      return result.value;
    }
  }

  [Symbol.asyncIterator]() {
    return this._asyncIteratorFactory();
  }
}

module.exports = AsyncIterableStream;
