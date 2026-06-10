---
layout: project
title: "Profiler-Driven FSDP Optimization"
tagline: "Full-parameter FSDP fine-tuning of MedGemma 4B on 2×H100: profiler-driven optimization (−31% step time, +46% throughput) and fault-tolerant checkpointing with a kill -9 recovery demo."
date: 2026-05-28
status: "completed"
order: 5
tags: ["distributed-training", "FSDP", "systems", "performance"]
github: "https://github.com/ayushkokande/medgemma-fsdp"
paper: ""
demo: ""
---

## Distributed Training Efficiency & Recovery

Profiled and optimized full-parameter fine-tuning of **MedGemma 4B** (4.3B params) across **2×H100s** with PyTorch FSDP, cutting step time **31% (327.9 → 225.9 ms)** and raising throughput **46% (12.4K → 18K tok/s)** while reducing peak memory below baseline. Every comparison ran against a 3-run baseline at 1.75% CV, one variable changed at a time. Profiling showed **37–43% of each step was inter-GPU communication**, traced to FSDP's `FULL_SHARD` all-gathering identical weights twice per step. Along the way I caught a profiler artifact reporting communication at **150% of step time**, and showed a recovery run's apparent **4.5% MFU** was wall-clock dilution from checkpoint I/O consuming 74% of runtime, not slow training.

The surprising result: after fixing the communication bottleneck (−7%), the bigger win came from `torch.compile` kernel fusion (−26% further), and that fusion erased all the memory the communication fix had spent, pushing peak memory below baseline.

## Highlights

- **Measurement rigor:** 3-run baseline with per-phase timing (forward/backward/optimizer), 1.75% CV; rejected profiler runs showing comm >100% of step time as artifacts: the profiler sums dedicated NCCL streams, which run concurrently with compute and include time blocked waiting on the peer rank, so summed "communication time" can exceed wall-clock step time.
- **Root cause, not symptom:** traced 37–43% comm overhead to `FULL_SHARD` re-fetching unchanged weights in backward: one redundant all-gather per FSDP-wrapped block, on top of the necessary forward gathers.
- **Ablation 1 (`SHARD_GRAD_OP`):** −6.8% step time, all_gather −16%, at +5.8 GB memory cost.
- **Ablation 2 (`torch.compile`):** −26% further; backward −38.7% vs optimizer −0.5%, consistent with backward's higher elementwise-op density.
- **Fault recovery:** `kill -9` mid-run → resumed from the last complete sharded checkpoint (step 40); progress loss bounded by one checkpoint interval (≤19 steps, ~6 s of compute), post-resume speed within 5% of baseline.
- **Honest bottleneck accounting:** frequent checkpointing consumed 74% of wall time (13 saves, ~26 GB each: params + two Adam moments in bf16 across both ranks), documented as the real cost of tight checkpoint intervals.

## Baseline and Bottleneck

The `FULL_SHARD` baseline measured 327.9 ms/step (1.75% CV over 3 runs), 12,354 tok/s aggregate, and 16.1% MFU at 41.5 GB/GPU peak memory.

PyTorch profiler traces showed **37–43% of every step spent in inter-GPU NCCL communication**. The root cause: `FULL_SHARD` all-gathers the same unchanged layer weights twice per step (one all-gather per FSDP-wrapped block in forward, then the same set re-fetched in backward), burning 84+ ms of redundant bandwidth.

## Optimizations

Each change was applied as a single variable on top of the previous config:

| Configuration | Step Time | Throughput | MFU | Peak Mem/GPU |
|---|---:|---:|---:|---:|
| Baseline (`FULL_SHARD`) | 327.9 ms | 12,354 tok/s | 16.1% | 41.49 GB |
| + `SHARD_GRAD_OP` | 305.5 ms | 13,212 tok/s | 17.2% | 47.29 GB |
| + `torch.compile` | **225.9 ms** | **18,002 tok/s** | **23.5%** | **39.39 GB** |

*Each row is applied on top of the previous one, so per-step deltas chain: net vs baseline is −31.1% step time, +45.7% throughput, −2.10 GB peak memory.*

`SHARD_GRAD_OP` keeps assembled parameters resident between forward and backward, eliminating the redundant backward all-gathers (+5.8 GB/GPU memory cost). `torch.compile` then fused the many small elementwise kernels, most effective on the backward pass, and its fusion of intermediate tensors actually brought peak memory **2.10 GB *below* baseline**.

## Checkpointing and Recovery

Checkpoints save model, optimizer, LR-scheduler, and RNG state plus step counter and world size, written as sharded `SHARDED_STATE_DICT` files in parallel per rank. Writes are atomic (`*.tmp` then `os.replace`), and the `latest` pointer only advances after a `dist.barrier()`, so a mid-write crash can never corrupt the resume point.

The recovery demo checkpoints every 20 steps, launches training, sends `kill -9` to all ranks after 120 s, and relaunches with `--resume`. The run resumed cleanly from the last complete checkpoint (step 40), with progress loss bounded by one checkpoint interval, and continued at baseline-equivalent throughput (310.4 ms/step). The writeup also quantifies checkpoint I/O cost honestly: 13 saves of ~26 GB each consumed 74% of wall time, a deliberately tight interval for the demo (one save per ~6 s of compute; the training config checkpoints every 100 steps).

## Limitations

The README documents what is *not* handled: node power loss, NaN detection, world-size validation on resume, FSDP1 API deprecation, and MFU excluding attention FLOPs. This keeps the measured claims bounded and reproducible.
