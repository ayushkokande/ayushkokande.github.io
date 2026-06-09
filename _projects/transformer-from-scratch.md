---
layout: project
title: "End-to-End Transformer LM Pretraining"
tagline: "A 17M-parameter decoder-only Transformer pretrained from scratch with a custom byte-level BPE tokenizer, hand-built AdamW, and matched architecture ablations."
date: 2026-02-01
status: "completed"
order: 3
tags: ["pretraining", "transformers", "pytorch"]
github: "https://github.com/ayushkokande/Transformer-Language-Model"
paper: ""
demo: "#"
---

## Overview

This project implements a complete small-scale language-model pretraining stack from tokenizer to optimizer. The model is a **17M-parameter decoder-only Transformer** trained on TinyStories with direct PyTorch implementations of the architecture, training loop, and data pipeline.

## Architecture

The model uses RMSNorm, RoPE, SwiGLU, and pre-norm Transformer blocks without `nn.Transformer` or `nn.MultiheadAttention`. Every component from embeddings to the language-model head is implemented directly, which made tensor shapes, masking behavior, and architectural changes explicit.

## Tokenizer

I trained a byte-level **BPE tokenizer** with a 10K vocabulary on the full TinyStories corpus. Multiprocess pre-tokenization and an incremental pair-count index restrict merge updates to affected words, bringing tokenizer training under two minutes.

## Training System

The pretraining loop includes:

- AdamW with decoupled weight decay, implemented from the optimizer equations.
- Cosine learning-rate annealing with linear warmup.
- Global-norm gradient clipping for stability.
- Memory-mapped data loading.
- Resumable model and optimizer checkpointing.

## Ablations

I ran matched-parameter ablations to isolate the validation-loss contribution of RMSNorm, pre-norm vs. post-norm, RoPE vs. NoPE, and SwiGLU vs. SiLU. Modules were validated against a reference suite, including tokenizer parity checks against `tiktoken`.

## Takeaway

Building the full pretraining loop made the hidden infrastructure visible: tokenizer throughput, optimizer state, checkpoint recovery, and controlled ablations mattered as much as the model definition itself.
