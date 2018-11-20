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

describe('AsyncIterableStream', () => {
  let streamData;
  let stream;

  // The generator function passed to the AsyncIterableStream must be a pure function.
  async function* createDataConsumerGenerator(dataPromiseList) {
    while (dataPromiseList.length) {
      let result = await dataPromiseList[dataPromiseList.length - 1];
      yield result;
    }
  }

  beforeEach(async () => {
    streamData = [...Array(10).keys()]
    .map(async (value, index) => {
      await wait(10 * (index + 1));
      streamData.pop();
      return value;
    })
    .reverse();
    stream = new AsyncIterableStream(() => {
      return createDataConsumerGenerator(streamData);
    });
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
});
