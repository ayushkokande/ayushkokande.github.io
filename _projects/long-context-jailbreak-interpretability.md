---
layout: project
title: "Long-Context Jailbreak Interpretability"
tagline: "Causal refusal-direction analysis for Qwen3-14B across long-context jailbreak settings, with preregistered context-length sweeps and validity checks."
date: 2026-05-01
status: "completed"
order: 2
tags: ["interpretability", "safety", "transformers"]
github: ""
paper: ""
demo: "#"
---

## Overview

This project studies whether long-context jailbreaks weaken a model's refusal behavior by diluting safety-relevant attention. I tested that hypothesis on **Qwen3-14B** with 40 layers, `d_model = 5120`, and 32K context, using activation-level interventions and preregistered context-length sweeps.

## Refusal Direction

I extracted a causal refusal direction from 256 harmful AdvBench prompts and 256 harmless Alpaca prompts using difference-of-means over residual-stream activations. The safety read-off localized cleanly at layer 20.

Layer-wise directional ablation validated the direction causally: removing the refusal direction drove the harmful-refusal rate from **95% to 1%**.

## Context-Length Sweep

I ran a preregistered two-arm scaling sweep over benign filler lengths:

`L in {0, 512, 2K, 8K, 16K, 32K}`

The intact arm kept refusal flat at approximately 95% across all context lengths, while the directionally ablated control collapsed to approximately 1%. That falsified the dilution hypothesis at this scale and turned the result into a clean, bounded negative finding.

## Validity Battery

To address domain-shift critiques, I re-derived the refusal direction with a covariate-matched harmful/harmless set matched on verb class and word length, then compared per-layer cosine similarity to the original direction.

I also ran a preregistered 2x2 intent-by-topic ANOVA with 50 prompts per cell and a decision rule based on partial eta-squared at layer 20. This ruled out vocabulary and topic dominance as confounds in the learned refusal direction.

## Reproducibility

The full pipeline runs as SLURM batch jobs on 2xA100 SXM4 40GB inside a Singularity container with a uv-managed Python environment and BF16 inference. Per-prompt projections, ANOVA outputs, figures, and paper-ready artifacts are emitted to versioned results directories.
