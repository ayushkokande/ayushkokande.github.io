---
layout: project
title: "Systems-And-Parallelism"
tagline: "Fused Triton FlashAttention-2 kernel with online softmax, O(N) attention memory, 18x forward speedup, and 2x throughput gains for 2.7B-scale training."
date: 2026-03-01
status: "completed"
order: 4
tags: ["systems", "triton", "gpu"]
github: "https://github.com/ayushkokande/Systems-And-Parallelism"
paper: ""
demo: "#"
---

## Transformer Systems & Performance Engineering

A from-scratch GPU performance study of a GPT-style Transformer (128M–2.7B params) on an NVIDIA A100-80GB — profiling and optimizing attention, precision, and compilation. I wrote a custom **Triton FlashAttention** kernel that runs the forward pass **up to 17.9× faster** than naive PyTorch attention (35.2 → 2.0 ms) and sidesteps the out-of-memory wall that kills naive attention past 16K tokens. **torch.compile** cuts small-model forward latency **3.46×** (36.0 → 10.4 ms) and **bf16 autocast** speeds large-model training steps **up to 4.41×**. The work is measurement-first: an nsys/Nsight profiling pass attributes runtime to individual CUDA kernels, and a warmup ablation shows how a careless benchmark reports *223 ms ± 553 ms* versus the true *36.8 ms ± 0.2 ms* once GPU cold-start is controlled. Most surprising finding: **softmax consumes ~40% of attention runtime on ~50× fewer FLOPs than the matmuls** — it's memory-bandwidth-bound, exactly the bottleneck FlashAttention fusion targets.

## Highlights

- **Custom Triton FlashAttention** — forward up to **17.9×** faster than naive (median 6.16× across 76 configs); scales to **64K** context where naive attention OOMs at 16K.
- **Root-caused the OOM** to the B×T×T attention-score matrix (**8.02 GB at 16K tokens** vs ~24 MB for Q/K/V); confirmed quadratic memory scaling (doubling context ≈ 4× peak memory, measured 3.97×).
- **torch.compile: 3.46× → 1.08×** speedup from small to 2.7B model — overhead-bound small models gain most; large models already saturate the GPU.
- **bf16: up to 4.41× faster** training step at scale, but only ~4–9% peak-memory savings (params and optimizer state stay FP32).
- **Benchmark rigor** — warmup ablation collapsed timing variance from ±553 ms to ±0.2 ms; nsys profiling tracked matmul share rising 67.7% → 72.4% from inference to a full training step.

**Stack:** PyTorch · Triton · CUDA · nsys/Nsight
