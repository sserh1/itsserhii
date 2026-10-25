---
title: A Bloom filter in 30 lines of Python
date: 2026-10-25
tags: [python, data-structures]
---

I had a small crawler that kept a `set` of every URL it had already visited. At a few million URLs, that set alone was using more memory than the rest of the process. I didn't need to *store* the URLs. I only needed to answer one question: have I seen this one before?

That's exactly the job of a [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter): a bit array that answers "definitely not" or "probably yes", and nothing else.

## How it works

A Bloom filter is an array of `m` bits, all zero at the start, plus `k` hash functions.

1. To add an item, hash it `k` times and set the bit at each of those positions.
2. To check an item, hash it the same way and look at the same bits.
3. If any of them is zero, the item was never added. If all of them are set, it *probably* was.

There are no false negatives, only false positives: bits set by other items can make a new one look familiar. You also can't remove anything, because clearing a bit might erase another item's trace.

> A Bloom filter never forgets, and occasionally remembers things that never happened.

## The code

Two numbers decide everything: how many bits to allocate and how many hashes to use. Both follow from the number of items you expect and the error rate you can live with.

```python
import hashlib
import math


class BloomFilter:
    def __init__(self, capacity: int, error_rate: float = 0.01):
        # Optimal number of bits and hash functions for the target error rate.
        self.size = math.ceil(-capacity * math.log(error_rate) / math.log(2) ** 2)
        self.hashes = max(1, round(self.size / capacity * math.log(2)))
        self.bits = bytearray(math.ceil(self.size / 8))

    def _positions(self, item: str):
        digest = hashlib.sha256(item.encode()).digest()
        h1 = int.from_bytes(digest[:8], "little")
        h2 = int.from_bytes(digest[8:16], "little")
        # Double hashing: derive k positions from just two hash values.
        for i in range(self.hashes):
            yield (h1 + i * h2) % self.size

    def add(self, item: str) -> None:
        for pos in self._positions(item):
            self.bits[pos // 8] |= 1 << (pos % 8)

    def __contains__(self, item: str) -> bool:
        return all(
            self.bits[pos // 8] & (1 << (pos % 8))
            for pos in self._positions(item)
        )
```

Instead of `k` independent hash functions, it takes one SHA-256 digest, splits it into two 64-bit numbers and combines them as `h1 + i * h2`. The trick is called [double hashing](https://en.wikipedia.org/wiki/Double_hashing), and in practice it works as well as having `k` real hashes.

## Does it work?

I added 100,000 URLs, then checked 100,000 URLs that were never added:

```python
bf = BloomFilter(capacity=100_000, error_rate=0.01)
for i in range(100_000):
    bf.add(f"https://example.com/page/{i}")

misses = sum(f"https://example.com/other/{i}" in bf for i in range(100_000))
print(misses / 100_000)  # 0.00994
```

That's a 0.99% false positive rate against a 1% target. The filter takes 117 KB. A `set` holding the same URLs took about 12 MB, a hundred times more.

### Bits per item

The only knob that really matters is how many bits you spend per item:

| bits per item | hashes | false positives |
|---|---|---|
| 4 | 3 | 14.7% |
| 8 | 6 | 2.2% |
| 10 | 7 | 0.82% |
| 16 | 11 | 0.046% |

Roughly every 5 extra bits per item cut the error rate by another factor of ten.

## When not to use one

- When you need the items back, not just a yes or no.
- When you need to delete things. Counting Bloom filters or cuckoo filters handle that.
- When a false positive is expensive. For the crawler it meant skipping about one new page in a hundred, which was fine.
