---
title: "Attention Dilution in Long-Context Transformers"
tagline: "Investigating how attention scores degrade as context length grows, and when models stop actually 'reading' early tokens."
date: 2025-11-15
status: "in progress"
order: 1
tags: ["interpretability", "transformers", "long-context"]
github: "https://github.com/yourusername/attention-dilution"
paper: ""
demo: ""
---

## Motivation

Long-context language models advertise 128k, 200k, even 1M token windows — but empirical evidence suggests that attention becomes increasingly diffuse as context grows. This project investigates *how* and *where* that dilution happens inside small open-weight models.

## Approach

Using **TransformerLens** on Pythia-410m and Pythia-1.4b, I measured per-head attention entropy across varying context lengths (512 → 8192 tokens) on a fixed set of retrieval-style probes.

Key experiments:

- **Entropy heatmaps** by layer and head across context lengths.
- **Needle-in-haystack** probes to correlate high-entropy heads with retrieval failure.
- **Head ablations** to identify which heads matter most at long context.

## Findings

> Attention entropy grows roughly logarithmically with context length in most heads, but a small cluster of "retrieval heads" in middle layers maintains sharp focus even at 8k tokens.

Preliminary results suggest these retrieval heads are disproportionately responsible for successful long-context behavior — ablating just 3–5 of them collapses needle-in-haystack accuracy below chance.

## Next Steps

- Scale to larger Pythia models and compare scaling behavior.
- Test whether retrieval heads transfer across finetuned variants.
- Write up as a short technical report for LessWrong / Alignment Forum.

## Takeaways

Interpretability work doesn't require a frontier model. Small open-weight models reveal real structure, and the tooling (TransformerLens, nnsight) is mature enough for an individual researcher to make meaningful progress.
