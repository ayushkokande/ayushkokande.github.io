---
title: "A Systematic Benchmark for LLM Jailbreak Robustness"
tagline: "An evaluation suite that tests safety-tuned models against six classes of jailbreak, with reproducible scoring across model families."
date: 2025-07-10
status: "in progress · open source"
order: 3
tags: ["red-teaming", "evaluations", "safety"]
github: "https://github.com/yourusername/jailbreak-bench"
paper: ""
---

## Why This Benchmark

Existing jailbreak datasets (e.g., AdvBench, HarmBench) are valuable but heterogeneous — they mix attack types, don't systematically vary difficulty, and aren't always reproducible across labs.

This project builds a **structured benchmark** with six distinct categories:

1. Role-play / persona
2. Encoded prompts (base64, leetspeak, translation)
3. Many-shot in-context examples
4. Prefix injection
5. Logic/hypothetical framings
6. Multi-turn social engineering

Each category contains 80–120 prompts spanning three difficulty tiers.

## Scoring

I use a two-stage grading pipeline:

- **Stage 1**: Keyword refusal detection (fast, high-precision filter).
- **Stage 2**: LLM-as-judge with rubric for borderline cases, with 3-judge consensus.

Inter-judge agreement is reported alongside headline numbers — a detail most benchmarks skip.

## Early Results

Across Llama-3-8B-Instruct, Qwen-2.5-7B-Instruct, and Mistral-7B-Instruct:

- **Prefix injection** remains the most effective attack class across all models (55–70% success).
- **Role-play** attacks are now largely mitigated in instruction-tuned models (10–20% success).
- **Multi-turn** jailbreaks significantly outperform single-turn across every category — a pattern not captured by single-turn benchmarks.

## What's Next

- Expand to 14B+ and closed-source models via API.
- Release v0.1 publicly with a leaderboard.
- Write up findings as a short workshop submission.

## Why This Matters

Benchmarks shape what the field optimizes for. A benchmark that conflates attack types tells you *whether* a model is safe but not *how* it fails. Disaggregating by attack category gives defenders something actionable.
