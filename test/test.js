const AsyncIterableStream = require('../index');
const assert = require('assert');

let pendingTimeoutSet = new Set();

function wait(duration) {
  return new Promise((resolve) => {
    let timeout = setTimeout(() => {
      pendingTimeoutSet.clear(timeout);
      resolve();
    }, duration);
    pendingTimeoutSet.add(timeout);
  });
}

function cancelAllPendingWaits() {
  for (let timeout of pendingTimeoutSet) {
    clearTimeout(timeout);
  }
}

class AsyncIterableStreamSubclass extends AsyncIterableStream {
  constructor(dataPromiseList) {
    super();
    this._dataPromiseList = dataPromiseList;
  }

  async *createAsyncIterator() {
    while (this._dataPromiseList.length) {
      let result = await this._dataPromiseList[this._dataPromiseList.length - 1];
      yield result;
    }
  }
}

describe('AsyncIterableStream', () => {

  describe('AsyncIterableStream abstract class', () => {
    let abstractStream;

    beforeEach(async () => {
      abstractStream = new AsyncIterableStream();
    });

    afterEach(async () => {
      cancelAllPendingWaits();
    });

    it('should throw error if createAsyncIterator() is invoked directly on the abstract class', async () => {
      let result;
      let error;
      try {
        result = abstractStream.createAsyncIterator();
      } catch (err) {
        error = err;
      }
      assert.equal(error.name, 'TypeError');
      assert.equal(error.message, 'Method must be overriden by subclass');
    });
  });

  describe('AsyncIterableStream subclass - Active stream', () => {
    let stream;

    beforeEach(async () => {
      let streamData = [...Array(10).keys()]
      .map(async (value, index) => {
        await wait(20 * (index + 1));
        streamData.pop();
        return value;
      })
      .reverse();

      stream = new AsyncIterableStreamSubclass(streamData);
    });

    afterEach(async () => {
      cancelAllPendingWaits();
    });

    it('should receive packets asynchronously', async () => {
      let receivedPackets = [];
      for await (let packet of stream) {
        receivedPackets.push(packet);
      }
      assert.equal(receivedPackets.length, 10);
      assert.equal(receivedPackets[0], 0);
      assert.equal(receivedPackets[1], 1);
      assert.equal(receivedPackets[9], 9);
    });

    it('should receive packets asynchronously from multiple concurrent for-await-of loops', async () => {
      let receivedPacketsA = [];
      let receivedPacketsB = [];

      await Promise.all([
        (async () => {
          for await (let packet of stream) {
            receivedPacketsA.push(packet);
          }
        })(),
        (async () => {
          for await (let packet of stream) {
            receivedPacketsB.push(packet);
          }
        })()
      ]);

      assert.equal(receivedPacketsA.length, 10);
      assert.equal(receivedPacketsA[0], 0);
      assert.equal(receivedPacketsA[1], 1);
      assert.equal(receivedPacketsA[9], 9);
    });

    it('should receive next packet asynchronously when once() method is used', async () => {
      let nextPacket = await stream.once();
      assert.equal(nextPacket, 0);

      nextPacket = await stream.once();
      assert.equal(nextPacket, 1);

      nextPacket = await stream.once();
      assert.equal(nextPacket, 2);
    });

    it('should receive next packet asynchronously when once() method is used and sufficiently long timeout values are provided', async () => {
      let nextPacket = await stream.once(30);
      assert.equal(nextPacket, 0);

      nextPacket = await stream.once(30);
      assert.equal(nextPacket, 1);

      nextPacket = await stream.once(30);
      assert.equal(nextPacket, 2);
    });

    it('should throw error if timeout value is specified and it occurs before the next once() value is received', async () => {
      let nextPacket;
      let error;
      try {
        // Set the timeout to 10 ms. Next packet is in 20 ms.
        nextPacket = await stream.once(10);
      } catch (err) {
        error = err;
      }
      assert.equal(nextPacket, null);
      assert.notEqual(error, null);
      assert.equal(error.name, 'TimeoutError');
    });
  });

  describe('AsyncIterableStream subclass - Inactive stream', () => {
    let stream;

    beforeEach(async () => {
      stream = new AsyncIterableStreamSubclass([new Promise(() => {})]);
    });

    afterEach(async () => {
      cancelAllPendingWaits();
    });

    it('should throw error if once() does not resolve before a specified timeout', async () => {
      let nextPacket;
      let error;
      try {
        nextPacket = await stream.once(100);
      } catch (err) {
        error = err;
      }
      assert.equal(nextPacket, null);
      assert.notEqual(error, null);
      assert.equal(error.name, 'TimeoutError');
    });
  });
});
