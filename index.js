class AsyncIterableStream {
  constructor(asyncIteratorFactory) {
    this._asyncIteratorFactory = asyncIteratorFactory;
  }

  next() {
    return this._asyncIteratorFactory().next();
  }

  async once() {
    return (await this.next()).value;
  }

  [Symbol.asyncIterator]() {
    return this._asyncIteratorFactory();
  }
}

module.exports = AsyncIterableStream;
