---
layout: project
title: "Reasoning-Reinforcement-Learning"
tagline: "End-to-end reasoning-model post-training with response-masked SFT, vLLM rollouts, GRPO/PPO-style updates, and reproducible SLURM jobs."
date: 2026-04-01
status: "completed"
order: 1
tags: ["post-training", "GRPO", "vLLM", "SLURM"]
github: "https://github.com/ayushkokande/Reasoning-Reinforcement-Learning"
paper: ""
demo: "#"
---

## Overview

This project builds a full reasoning-model post-training stack around **Qwen2.5-Math-1.5B**: supervised fine-tuning on reasoning traces, periodic held-out evaluation through vLLM, and a from-scratch GRPO loop for reinforcement learning on Countdown.

The goal was not just to run a recipe, but to make each training signal observable: response masking, reward decomposition, rollout variance, clip fraction, entropy, gradient norms, and validation reward all logged in one reproducible pipeline.

Before training anything, I ran a failure-mode analysis on the zero-shot baseline: 33.2% of outputs were parseable but mathematically wrong and only 6% were format failures (repetitive loops, token-budget truncation, symbolic-only answers) — establishing that the bottleneck was the model, not the answer parser.

## Supervised Fine-Tuning

I trained on PrimeIntellect INTELLECT-MATH reasoning traces with **response-masked negative log-likelihood**, BF16 AdamW, linear warmup, gradient clipping at 1.0, and gradient accumulation across a subset-size sweep: `{128, 256, 512, 1024, full}`.

The trainer ran on a 2-GPU topology paired with vLLM for held-out **MATH-12K** evaluation. Policy weights hot-reloaded into the evaluator so training-step curves and evaluation-step curves could be compared cleanly in wandb.

Counterintuitively, the best checkpoint came from the smallest 128-example subset (78.2% peak validation accuracy), with accuracy declining as the dataset grew under a fixed compute budget — evidence that SFT gains came from learning output format and sampling behavior rather than new math knowledge.

## GRPO Loop

For reinforcement learning, I implemented a GRPO loop on Countdown with **10K train / 1024 validation** examples. The loop uses vLLM group rollouts with `G = 8` and `T = 0.7`, group-normalized advantages, microbatched policy-gradient updates, and PPO-style importance-ratio clipping at `epsilon = 0.2` for the off-policy variant.

I tuned the learning rate through a three-config sweep and pushed validation reward beyond the 30% Countdown target.

Qualitatively, early rollouts rambled through wrong arithmetic and never closed the answer tag; by step 450 the model produced clean step-by-step derivations with exact arithmetic and full format compliance.

## Ablations

The project includes end-to-end comparisons across:

- No-baseline REINFORCE vs. REINFORCE with a group-normalized baseline.
- Masked mean credit assignment vs. Dr. GRPO-style masked normalized sequence-level credit assignment.
- Group-standard-deviation normalization on vs. off.

For each configuration, I compared validation reward, gradient-norm stability, reward variance, clip fraction, and per-token entropy.

## Reproducibility

The pipeline is packaged as SLURM `sbatch` jobs with a uv-managed Python environment, deterministic seeds, versioned checkpoints, and pytest coverage for tokenization, response masking, group-normalized rewards, and the PPO-clip objective.
