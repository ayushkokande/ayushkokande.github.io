---
layout: project
title: "Long-Context Jailbreak Interpretability"
tagline: "Causal refusal-direction analysis for Qwen3-14B tracing long-context jailbreaks to a two-head circuit (L20H10 → L36H31); jailbreak susceptibility is format-conditional, not length-conditional."
date: 2026-05-01
status: "completed"
order: 2
tags: ["interpretability", "safety", "transformers"]
github: "https://github.com/ayushkokande/attention_dilution"
paper: "https://github.com/ayushkokande/attention_dilution/blob/main/submission_408271332.pdf"
demo: ""
---

## Overview

Using Qwen3-14B on 520 AdvBench harmful prompts, we traced long-context jailbreaks to a specific two-head circuit (**L20H10 → L36H31**) via difference-of-means extraction, six-format dilution sweeps, and denoising path patching — all validated against four preregistered confound controls showing the refusal direction encodes harm intent (AUC_intent=1.000) rather than lexical register or topic.

The headline finding is that jailbreak susceptibility is **format-conditional, not length-conditional**: five of six bloat formats preserve refusal at ≥87% even at N=4096, while the distractor (numbered-list) format collapses refusal from 97% to 0% at just ~31 tokens. The failure is **attentional, not representational** — the dominant Guardrail Head L36H31 loses 6× of its attention mass on harmful tokens while the refusal direction itself stays geometrically intact across the full sweep. Single-site activation steering fails because the distractor bloat flips the sign of d̂'s projection at L36 (from +512 to −58), pointing to the upstream lesion at L20H10 as the correct intervention target.

## Refusal Direction

I extracted a causal refusal direction **d̂ at layer 36/40** from harmful AdvBench prompts and harmless Alpaca prompts using difference-of-means over residual-stream activations. Causal ablation drops the harmful-refusal rate **93.65% → 0% with zero harmless false positives**.

The direction tracks **harm intent, not surface form**: AUC_intent=1.000 versus AUC_vocab=0.597 (chance), with η²(intent)=0.963 against η²(topic)=0.002.

## Format-Conditional Collapse

I ran a preregistered six-format dilution sweep at matched token budgets. The distractor (numbered-list) format breaks refusal at **~31 tokens**, while five other formats hold **≥87% at N=4096** — same model, same prompts, same token budget. Length alone does not weaken refusal; the bloat *format* does.

## Guardrail Head

The dominant Guardrail Head **L36H31** (DLA=+14.72, 2.15× the next head) loses **6× of its attention** on harmful tokens under the distractor format, yet the V_refusal projection stays flat — confirming an **attentional failure, not a representational one**.

## Steering & Circuit

Single-site activation steering fails for **N≥512 at all tested α**: under distractor bloat the d̂ projection sign inverts (**+512 → −58**), requiring α≳60 (4× the largest tested) to rescue. Denoising path patching localizes the cause upstream: the two-head circuit **L20H10 → L36H31** accounts for **2.54× the recovery** of the next-best head, marking L20H10 as the correct intervention target.

## Validity & Capability

To address domain-shift critiques, I re-derived d̂ on a covariate-matched harmful/harmless set (matched on verb class and word length) and ran a preregistered 2×2 intent-by-topic ANOVA with a partial-eta-squared decision rule — ruling out vocabulary and topic dominance as confounds. The ablation is **capability-narrow**: MMLU stays within ±3pp with zero spurious benign refusals.

## Reproducibility

The full pipeline runs as SLURM batch jobs on 2×A100 SXM4 40GB inside a Singularity container with a uv-managed Python environment and BF16 inference. Per-prompt projections, ANOVA outputs, figures, and paper-ready artifacts are emitted to versioned results directories.
