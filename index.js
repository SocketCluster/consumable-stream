class AsyncIterableStream {
  constructor(generatorFactory) {
    this.generatorFactory = generatorFactory;
  }

  next() {
    return this.generatorFactory().next();
  }

  async once() {
    return (await this.next()).value;
  }

  [Symbol.asyncIterator]() {
    return this.generatorFactory();
  }
}

module.exports = AsyncIterableStream;
