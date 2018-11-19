# async-iterable-stream
A readable stream which can be iterated over using a for-await-of loop.

The constructor accepts an `asyncIteratorFactory` as argument; this can be either an async generator function or a regular function which returns an async iterator.
In the case of a generator function, the `asyncIteratorFactory` should yield a sequence of `Promise` objects which resolve one at a time in the same order as they appear in the sequence.

## Installation

```
npm install async-iterable-stream
```
