---
layout: project
title: "Pico-LLM"
tagline: "Three language-model architectures (k-gram MLP, LSTM, decoder-only Transformer with RMSNorm) built and compared head-to-head on TinyStories, with from-scratch nucleus sampling and attention-weight visualization."
date: 2025-12-01
status: "completed"
order: 7
tags: ["transformers", "pytorch", "nlp"]
github: "https://github.com/ayushkokande/Pico-LLM"
paper: ""
demo: ""
---

## Overview

Pico-LLM (NYU CSCI-GA.2565, Fall 2025) implements and compares three sequence-to-sequence language-model families on the same data, tokenizer, and training loop: a **k-gram MLP** with a sliding-window context, an **LSTM** baseline, and a **causal decoder-only Transformer** built from scratch with custom multi-head attention and **RMSNorm**. Holding everything but the architecture fixed makes the comparison clean: same GPT-2 BPE tokenization (50,257-token vocab via `tiktoken`), same next-token cross-entropy objective, same generation harness.

All three models train on a mixed pipeline that samples between **TinyStories** and custom text corpora with a configurable mixing probability, so the same code studies both natural-language generation and synthetic-sequence extrapolation.

## Transformer

The Transformer is a pre-norm causal decoder: token embedding, stacked Transformer blocks (multi-head self-attention with residual connections, feed-forward MLP with residual), RMSNorm written from the normalization equations rather than `nn.LayerNorm`, and a final unembedding layer. No `nn.Transformer` or `nn.MultiheadAttention`; attention masking, head splitting, and the softmax over scores are all explicit.

On a synthetic doubling-sequence corpus, the model goes from emitting noise at step 1 to exact extrapolation after three short epochs (average loss 1.83 → 0.01), completing `8 16 32 64 128 …` past the training horizon under greedy decoding.

## Nucleus Sampling

Generation supports greedy decoding and from-scratch **nucleus (top-p) sampling**: sort the softmax, keep the smallest prefix whose mass reaches p, renormalize, and sample. The harness generates side-by-side samples at greedy, p = 0.95, and p = 1.0 every few hundred steps, making the diversity/coherence trade-off directly observable as training progresses.

## Analysis

- **Attention visualization:** per-block, per-head attention weights are extracted and plotted to inspect what positions each head attends to as sequences grow.
- **k-gram vs. recurrence vs. attention:** the k-gram MLP's fixed window, the LSTM's recurrent state, and the Transformer's full-context attention are compared on the same prompts, isolating how much context mechanism (not capacity) drives generation quality.
- **Component tests:** the k-gram model, nucleus sampler, Transformer forward pass, and generation loop each have unit tests validating shapes, masking, and probability handling.

**Stack:** PyTorch · tiktoken · TinyStories
