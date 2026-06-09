---
layout: project
title: "FlashAttention-2 & Systems Optimization"
tagline: "Fused Triton FlashAttention-2 kernel with online softmax, O(N) attention memory, 18x forward speedup, and 2x throughput gains for 2.7B-scale training."
date: 2026-03-01
status: "completed"
order: 4
tags: ["systems", "triton", "gpu"]
github: "https://github.com/ayushkokande/Systems-And-Parallelism"
paper: ""
demo: "#"
---

## Overview

This project implements and optimizes a fused **FlashAttention-2** kernel in Triton, with the systems work focused on tiled memory movement, online softmax, kernel autotuning, and profile-driven GPU utilization.

## Kernel Design

The forward pass tiles Q, K, and V blocks through SRAM and computes softmax online so the full attention matrix is never materialized. This cuts attention memory from `O(N^2)` to `O(N)` and enables 65K+ sequence lengths without out-of-memory failures.

The backward path recomputes softmax statistics rather than storing the full matrix, trading extra compute for dramatically lower memory pressure.

## Training Optimization

I integrated the kernel into a 2.7B-parameter training setup with BF16 autocast, `torch.compile`, and autotuning over block-size and `num_warps` configurations. The result was a **2x training-throughput improvement** over the baseline.

## Profiling

Using **Nsight Systems**, I isolated SM-occupancy stalls and warp-scheduling inefficiencies, then tuned launch parameters to reach more than 90% of theoretical peak TFLOPS on A100 SXM4 40GB.

## Results

- 18x forward-pass speedup vs. naive PyTorch attention on A100.
- `O(N)` attention memory through SRAM tiling and recomputation.
- 65K+ sequence lengths without OOM.
- 2x throughput improvement for 2.7B-scale training.
