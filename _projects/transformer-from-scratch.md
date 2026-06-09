---
layout: project
title: "Transformer LM from Scratch"
tagline: "A 17M-parameter decoder-only transformer built from first principles — custom BPE tokenizer, AdamW from scratch, and systematic RoPE vs. NoPE / SwiGLU ablations on TinyStories."
date: 2026-03-01
status: "completed"
order: 3
tags: ["transformers", "pytorch", "from-scratch"]
github: "https://github.com/ayushkokande/Transformer-Language-Model"
paper: ""
demo: ""
---

## Motivation

It's easy to use Hugging Face for a year without understanding what's actually happening inside a transformer. The point of this project wasn't to build a competitive model — it was to bypass the abstractions and have hands on every tensor operation, every gradient update, every architectural decision. The deliverable is fluency, not benchmark numbers.

## Approach

### Tokenizer

A custom **Byte-Pair Encoding** tokenizer, written from scratch with parallelized pre-tokenization. The naive single-threaded version took uncomfortably long on the TinyStories corpus; the parallelized version brings training time **under two minutes**, which matters when you're iterating on tokenizer choices.

### Architecture

A 17M-parameter decoder-only transformer. Every layer — embedding, attention, MLP, layer norm — implemented directly in PyTorch without `nn.Transformer` or related high-level building blocks. This means tensor shapes are visible at every step, and architectural changes mean editing actual code rather than swapping config flags.

### Training suite

The training loop includes:

- A **custom AdamW** implementation, written from the optimizer formula rather than imported.
- **Cosine annealing** with warmup.
- **Gradient clipping** for training stability.
- Standard logging, checkpointing, and resumption.

Writing the optimizer was the single most useful exercise in the project — Adam's update rule is short, but actually implementing it forces you to confront the bias-correction terms and weight-decay decoupling that papers skim past.

### Ablations

The interesting part: systematic comparison of architectural choices on a fixed compute budget.

- **RoPE vs. NoPE** — does rotary position encoding actually help at this scale, or do attention patterns learn position implicitly?
- **SwiGLU vs. GELU** activations in the MLP — does the gated variant earn its extra parameters?

For each, I ran matched training runs to convergence and compared perplexity curves.

## Findings

> RoPE wins at this scale, but the margin is smaller than the literature suggests for small models — and SwiGLU's gains are mostly compute-matched at parameter parity.

The specific takeaway depends on the metric you care about (final perplexity vs. perplexity-per-FLOP), but doing the ablation yourself produces a much more textured intuition than reading a comparison table in a paper.

## Takeaways

- **Writing the optimizer changes your relationship with training.** When loss spikes, you have a mental model of exactly what's happening to the moments and the weight decay term, instead of treating the optimizer as a black box.
- **TinyStories is underrated as a research substrate.** The vocabulary is small, the patterns are clean, and you can iterate on architectural choices on a single GPU in an afternoon.
- **Ablations only count if the rest of the system is fixed.** Most of the work was infrastructure: making sure that two runs differ only in the variable under test. That part of research isn't glamorous but it's where rigor lives.

## Next Steps

- Scale to 100M+ parameters and rerun the ablations — small-model ablations often invert at scale.
- Plug the FlashAttention-2 Triton kernel in and confirm matched perplexity at higher throughput.
- Add a mechanistic-interpretability probe to one of the trained checkpoints to connect this to the [jailbreak project](/projects/mechanistic-jailbreaks/).
