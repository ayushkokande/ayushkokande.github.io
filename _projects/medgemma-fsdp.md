---
layout: project
title: "medgemma-fsdp"
tagline: "Full-parameter FSDP fine-tuning of MedGemma 4B on 2×H100: profiler-driven optimization (−31% step time, +46% throughput) and fault-tolerant checkpointing with a kill -9 recovery demo."
date: 2026-05-28
status: "completed"
order: 5
tags: ["distributed-training", "FSDP", "systems", "performance"]
github: "https://github.com/ayushkokande/medgemma-fsdp"
paper: ""
demo: "#"
---

## Overview

This project measures and optimizes full-parameter distributed fine-tuning of **MedGemma 4B** (text-only training) on **2×H100 SXM with NVLink** using PyTorch FSDP. The goal was training efficiency and failure recovery, not convergence: establish a rigorous baseline, find the bottleneck with a profiler, fix it one variable at a time, and prove the run survives a hard kill.

## Baseline and Bottleneck

The `FULL_SHARD` baseline measured 327.9 ms/step (1.75% CV over 3 runs), 12,354 tok/s aggregate, and 16.1% MFU at 41.5 GB/GPU peak memory.

PyTorch profiler traces showed **37–43% of every step spent in inter-GPU NCCL communication**. The root cause: `FULL_SHARD` all-gathers the same unchanged layer weights twice per step — once in forward, once again in backward — burning 84+ ms of redundant bandwidth.

## Optimizations

Each change was applied as a single variable on top of the previous config:

| Configuration | Step Time | Throughput | MFU |
|---|---:|---:|---:|
| Baseline (`FULL_SHARD`) | 327.9 ms | 12,354 tok/s | 16.1% |
| + `SHARD_GRAD_OP` | 305.5 ms | 13,212 tok/s | 17.2% |
| + `torch.compile` | **225.9 ms** | **18,002 tok/s** | **23.5%** |

`SHARD_GRAD_OP` keeps assembled parameters resident between forward and backward, eliminating 26 redundant all-gather ops per step (+5.8 GB/GPU memory cost). `torch.compile` then fused the many small elementwise kernels — most effective on the backward pass — and its fusion of intermediate tensors actually brought peak memory *below* baseline.

**Net result: −31.1% step time and +45.7% throughput over baseline.**

## Checkpointing and Recovery

Checkpoints save model, optimizer, LR-scheduler, and RNG state plus step counter and world size, written as sharded `SHARDED_STATE_DICT` files in parallel per rank. Writes are atomic (`*.tmp` then `os.replace`), and the `latest` pointer only advances after a `dist.barrier()`, so a mid-write crash can never corrupt the resume point.

The recovery demo launches training, sends `kill -9` to all ranks after 120 s, and relaunches with `--resume`. The run resumed cleanly from step 40 and continued at baseline-equivalent throughput (310.4 ms/step). The writeup also quantifies checkpoint I/O cost honestly: 13 saves consumed 74% of wall time in the demo, a deliberate stress configuration.

## Limitations

The README documents what is *not* handled — node power loss, NaN detection, world-size validation on resume, FSDP1 API deprecation, and MFU excluding attention FLOPs — so the measured claims stay bounded and reproducible.
