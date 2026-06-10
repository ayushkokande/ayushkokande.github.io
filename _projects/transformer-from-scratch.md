---
layout: project
title: "Transformer-Language-Model"
tagline: "A 28.9M-parameter decoder-only Transformer pretrained from scratch on 1.6B TinyStories tokens (val perplexity 3.37), with a custom byte-level BPE tokenizer, hand-built AdamW, and matched architecture ablations."
date: 2026-02-01
status: "completed"
order: 3
tags: ["pretraining", "transformers", "pytorch"]
github: "https://github.com/ayushkokande/Transformer-Language-Model"
paper: ""
demo: "#"
---

## Overview

This project implements a complete small-scale language-model pretraining stack from tokenizer to optimizer. The model is a **28.9M-parameter decoder-only Transformer** (RoPE, SwiGLU, RMSNorm, byte-level BPE; every component from scratch, no Hugging Face) trained on **1.6B tokens** of TinyStories with direct PyTorch implementations of the architecture, training loop, and data pipeline. It reaches **validation perplexity 3.37 (loss 1.22)**, improving from perplexity 4.08 at the 20k-iteration mark across a 3-epoch run, and is deployed as a live, CPU-only Hugging Face Spaces demo.

The most surprising result came from profiling the tokenizer: the merge algorithm cost only **4 seconds of a 120-second run**; 105 seconds went to multiprocessing IPC shipping token counts between workers, meaning the "expensive" BPE merges were never the bottleneck at all.

## Architecture

The model uses RMSNorm, RoPE, SwiGLU, and pre-norm Transformer blocks without `nn.Transformer` or `nn.MultiheadAttention`. Every component from embeddings to the language-model head is implemented directly, which made tensor shapes, masking behavior, and architectural changes explicit.

## Tokenizer

I trained a byte-level **BPE tokenizer** with a 10K vocabulary on the full 2.2 GB TinyStories corpus in **1 min 55 s at 227 MB peak memory** (4.12 bytes/token compression). Multiprocess pre-tokenization and an incremental pair-count index restrict merge updates to affected words.

## Training System

The pretraining loop includes:

- AdamW with decoupled weight decay, implemented from the optimizer equations.
- Cosine learning-rate annealing with linear warmup.
- Global-norm gradient clipping for stability.
- Memory-mapped data loading.
- Resumable model and optimizer checkpointing.

## Ablations

I ran matched-parameter ablations to isolate the validation-loss contribution of RMSNorm, pre-norm vs. post-norm, RoPE vs. NoPE, and SwiGLU vs. SiLU. Modules were validated against a reference suite, including tokenizer parity checks against `tiktoken`.

## Results

- **Validation loss 1.41 → 1.22 (perplexity 4.08 → 3.37)** from iteration 20k to 100k over a 3-epoch, 1.64B-token run.
- **Profiled before optimizing, fixed the right bottleneck:** merge updates took 4.1 s of a 119.8 s tokenizer run; 105.4 s was multiprocessing IPC.
- **BPE tokenizer (vocab 10k)** trains on the full 2.2 GB corpus in 1 min 55 s at 227 MB peak memory; 4.12 bytes/token.
- **Stripped optimizer state to cut checkpoints 3×** (~300 MB → ~100 MB) for free-tier CPU deployment, generating ~200 tokens in seconds.

## Takeaway

Building the full pretraining loop made the hidden infrastructure visible: tokenizer throughput, optimizer state, checkpoint recovery, and controlled ablations mattered as much as the model definition itself.
