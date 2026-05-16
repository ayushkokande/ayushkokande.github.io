---
title: "FlashAttention-2 in Triton"
tagline: "Custom Triton GPU kernel achieving 18× forward-pass speedup over naive PyTorch and 2× training throughput at 2.7B scale, with profile-driven optimization on A100."
date: 2026-03-01
status: "completed"
order: 2
tags: ["triton", "gpu", "systems"]
github: "https://github.com/ayushkokande/flashattention-triton"
paper: ""
demo: ""
---

## Motivation

Naive attention is the wall every long-context experiment eventually hits — `O(N²)` memory in sequence length, and the worst kind of GPU memory pattern: lots of small reads against HBM with no opportunity for reuse. FlashAttention solves this by tiling the computation so that the SRAM working set stays small and HBM traffic drops by an order of magnitude.

The paper is one thing; writing the kernel is another. This project is a from-scratch Triton implementation of FlashAttention-2, written to actually understand the memory hierarchy decisions that make it fast — not just import a fused op.

## Approach

### Tiled forward pass

The forward kernel partitions Q, K, V into blocks small enough to live in shared memory. Each program instance iterates over key/value blocks for one query block, accumulating the softmax online with the standard log-sum-exp running statistics. This collapses peak memory from `O(N²)` to `O(N)` — making 65K+ sequence lengths tractable on a single A100.

### Mixed precision and `torch.compile`

For end-to-end training throughput at 2.7B parameters, the kernel runs in **BF16** with FP32 accumulators for the softmax stats. Wrapping the surrounding model in `torch.compile` lets the compiler fuse the dequant/quant boundary with adjacent ops, removing what would otherwise be a meaningful overhead at this scale.

### Profile-driven tuning

The interesting part of writing GPU kernels isn't getting them correct — it's getting them fast. I used **Nsight Systems** to profile kernel execution, identify SM occupancy bottlenecks, and tune block sizes and pipeline depth. The first working version was correct but ran at a fraction of peak; the final version is close to the theoretical TFLOPS ceiling for the A100.

## Results

> **18× forward-pass speedup** over naive PyTorch attention, **2× end-to-end training throughput** at 2.7B parameter scale.

The biggest single win came from realizing that the initial implementation had low SM occupancy — not a compute or memory-bandwidth problem, but a *scheduling* problem. Tuning block sizes to keep more warps in flight per SM was worth more than any algorithmic change.

## Takeaways

- **Read the profiler before you read the paper a second time.** The naive implementation can be wrong about *which* bottleneck it has; Nsight tells you in 30 seconds what would take an hour of staring at code to guess.
- **Triton hits a useful sweet spot** between CUDA C++ and PyTorch. You give up some control over instruction scheduling, but you get a Python iteration loop and roughly 80% of CUDA's performance ceiling for kernels in this shape.
- **Systems thinking transfers.** Most of my instincts about hot paths, batching, and memory hierarchy came from production backend work — turns out the GPU's L1/L2/HBM hierarchy isn't conceptually different from CPU cache, network, and disk. The numbers are just bigger.

## Next Steps

- Backward pass kernel (currently using a reference implementation).
- Compare against H100 numbers — the FP8 path and async load semantics change the optimal block sizing.
- Integrate into the transformer LM training run for end-to-end ablation against vanilla attention.
