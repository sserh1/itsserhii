---
title: Building a tiny key-value store, and what it taught me about fsync
date: 2026-10-14
tags: [go, storage]
---

For the last few weekends I've been writing a small key-value store. It isn't meant for production. I wanted to understand what *actually* happens between calling `write()` and the data being safe on disk, and reading about it wasn't enough.

## The append-only log

The simplest durable design is a log. Every `set` appends a record to the end of a file, and an in-memory map points each key to its latest offset. It's the same idea as [Bitcask](https://riak.com/assets/bitcask-intro.pdf), minus everything that makes Bitcask usable.

```go
func (s *Store) Set(key, val []byte) error {
	off, err := s.f.Seek(0, io.SeekEnd)
	if err != nil {
		return err
	}
	if _, err := s.f.Write(encode(key, val)); err != nil {
		return err
	}
	s.index[string(key)] = off
	return nil
}
```

This looks durable. It isn't. When `Write` returns, the bytes have only reached the kernel. If the machine loses power a second later, the record is gone, and nothing ever told the caller.

## Where the data actually is

After a successful `write()`, your bytes can be sitting in any of these places:

- the kernel's page cache
- the drive's own volatile write cache
- the flash cells or the platter, finally

Only `fsync()` asks the kernel to push everything down to the device, and even then you are trusting the drive to be honest about its cache.

> A write that hasn't been synced is a suggestion, not a commit.

## Batching syncs

Calling `fsync` after every `set` is correct and painfully slow: on my laptop it capped the store at a few hundred writes per second. The usual trick is group commit. Writers append and wait, and one goroutine syncs the whole batch at once.

```go
// Sync pending writes every 10ms and wake up everyone waiting on them.
func (s *Store) syncLoop() {
	t := time.NewTicker(10 * time.Millisecond)
	defer t.Stop()
	for range t.C {
		s.mu.Lock()
		if len(s.waiters) > 0 {
			err := s.f.Sync()
			for _, w := range s.waiters {
				w <- err
			}
			s.waiters = s.waiters[:0]
		}
		s.mu.Unlock()
	}
}
```

Each write now waits up to 10ms longer, but throughput went up by two orders of magnitude. Next time: what happens when the log gets too big and has to be compacted.
