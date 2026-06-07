---
layout: project
title: "Mechanistic Analysis of Context-Length Jailbreaks"
tagline: "Tracing the circuit-level failure mode that lets long contexts bypass Phi-3's safety training — and reversing it with activation steering."
date: 2026-04-01
status: "completed"
order: 1
tags: ["interpretability", "safety", "transformerlens"]
github: "https://github.com/ayushkokande/mech-jailbreaks"
paper: ""
demo: ""
---

## Motivation

Long-context jailbreaks are usually treated as a prompt-engineering curiosity — pad enough garbage in front of a harmful request and the model complies. The interesting question isn't *whether* this works, it's *why*: what changes inside the model as context grows that causes a safety-tuned system to stop refusing?

This project answers that mechanistically for **Microsoft Phi-3**, using TransformerLens and integrated gradients to isolate the circuit responsible for refusal — and then deliberately re-engaging it at inference time to neutralize the attack.

## Approach

The work has three stages, each building on the last.

### 1. Identifying the refusal direction

Using **integrated gradients** on the residual stream, I mapped attribution flow through the network on paired prompts (harmful request alone vs. harmful request + long context). The contrastive pattern isolated a single dominant direction in mid-layer activations — call it `V_refusal` — whose magnitude correlated tightly with whether the model refused.

### 2. Locating the guardrail heads

I then traced which attention heads were responsible for writing to `V_refusal`. A small cluster in middle layers — what I call **guardrail heads** — accounted for the bulk of safety-relevant attribution. These heads activate strongly on harmful tokens in short contexts.

### 3. Quantifying attention dilution

I scaled context length from baseline up to several thousand tokens and measured per-head attribution to the harmful tokens. The result is a clean monotonic decay: guardrail heads progressively lose attribution mass to the harmful span as context grows, until their contribution falls below the threshold needed to write `V_refusal` into the residual stream. The model "stops paying attention" to the part it was trained to refuse on — not metaphorically, but in a measurable, head-specific way.

## Findings

> Safety failure under long context isn't a forgetting problem or a training-data gap — it's an attention-budget problem. The circuit is intact; the inputs reach it diluted.

This reframing has a concrete consequence: if the refusal circuit still exists but isn't firing strongly enough, you should be able to **rescue it** without retraining.

### Activation steering reverses the jailbreak

I extracted `V_refusal` from short-context refusals and injected it back into the residual stream at the guardrail-head layer during inference on long-context attacks. The model resumed refusing — without any weight updates, with no impact on benign long-context tasks, and with a clean tradeoff curve between injection strength and false-refusal rate.

## Takeaways

A few things this work pushed me to internalize:

- **Causal claims need ablations.** Correlating `V_refusal` magnitude with refusal behavior was suggestive; the steering experiment is what makes it causal.
- **Interpretability has cheap mitigations hiding inside it.** A clean circuit-level story often yields an inference-time fix that doesn't require touching weights — useful when retraining isn't an option.
- **Small open-weight models are enough.** Phi-3 has the structure to study this seriously. Frontier scale isn't a prerequisite for mechanistic work.

## Next Steps

- Test whether the refusal direction transfers across safety-tuned model families (Llama-Guard, Gemma-Safe).
- Stress the steering intervention against adaptive attacks that target `V_refusal` directly.
- Write up as a short technical report.
