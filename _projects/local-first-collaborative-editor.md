---
layout: project
title: "Local-First Collaborative Editor"
tagline: "A distributed, local-first collaborative text editor where every browser holds a full Yjs CRDT replica: concurrent and offline edits merge with strong eventual consistency, no central coordination, validated under partitions and out-of-order delivery."
date: 2026-05-01
status: "completed"
order: 6
tags: ["distributed-systems", "CRDT", "typescript"]
github: "https://github.com/shivasb42/distributed-collaborative-editor"
paper: ""
demo: ""
---

## Overview

A **local-first collaborative document system** in TypeScript: many independent replicas (browsers, tabs, devices) edit the same document concurrently, propagate updates through a WebSocket sync relay, persist locally, and converge under partitions and flaky networks. Each browser holds a **full document replica backed by Yjs CRDTs**, which guarantees **strong eventual consistency**: concurrent and offline edits merge automatically with zero data loss and no central coordination. Built for real multi-party collaboration, not a two-window demo.

## Sync Relay

A **Node.js WebSocket relay** implements the y-websocket sync protocol. Clients exchange **state vectors** on reconnect so only missing deltas transfer, instead of full document state. The relay fans updates out to the replica fleet and serves merged state to late joiners and recovering nodes. **Awareness state** (live cursors, presence) propagates ephemerally over the same channel without touching the persisted document.

## Offline-First Durability

Every CRDT update mirrors into **IndexedDB**, enabling instant recovery after crashes and reloads and an implicit **offline edit queue** that drains on reconnect: keep typing through a disconnect, and pending updates flush automatically when the relay returns. **BroadcastChannel**-based cross-tab sync keeps tabs on the same machine aligned without server round-trips.

## Fault Tolerance & CAP

The design picks **AP over linearizability**: replicas stay writable through partitions and converge after, rather than blocking on coordination. Fault tolerance is validated under **network partitions, relay outages, and duplicate/out-of-order delivery**, with causal buffering via logical clocks ensuring correct convergence regardless of arrival order. A built-in test panel simulates offline mode, forces syncs, and inspects state vectors to make the failure modes observable.

**Stack:** TypeScript · Yjs (CRDT) · Node.js WebSockets · Next.js · React · IndexedDB
