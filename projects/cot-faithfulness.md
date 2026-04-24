---
title: "Probing Chain-of-Thought Faithfulness"
tagline: "When LLMs 'reason out loud,' do the intermediate steps actually drive the final answer — or are they post-hoc rationalizations?"
date: 2025-09-20
status: "completed"
order: 2
tags: ["evaluations", "reasoning", "LLMs"]
github: "https://github.com/yourusername/llm-reasoners"
paper: ""
---

## The Question

Chain-of-thought prompting improves LLM performance on reasoning tasks — but it's not clear whether the intermediate reasoning *causes* the improvement, or whether the model would have arrived at the same answer anyway and is simply generating plausible-sounding justification.

## Method

I adapted the **faithfulness test protocol** from Turpin et al. (2023) across three model families (Llama-3-8B, Mistral-7B, Qwen-2.5-7B):

1. **Perturbation test.** Inject errors into CoT traces mid-generation and measure whether the final answer shifts.
2. **Truncation test.** Cut CoT at varying depths and measure accuracy falloff.
3. **Shuffle test.** Reorder reasoning steps and measure whether the model notices.

## Results

Across ~2,400 evaluations on GSM8K and a custom logic puzzle set:

- Models recover from injected errors **~60% of the time** — suggesting CoT is partially but not fully causal.
- Truncation reveals a clear threshold: removing the final reasoning step drops accuracy ~40%, but removing early steps often has little effect.
- Shuffling produces inconsistent behavior: some models flag the disorder, others proceed as if nothing changed.

## Implications

Faithfulness varies meaningfully by model family — not a single phenomenon. This matters for safety work that relies on CoT as a monitoring signal: if models can confabulate reasoning, CoT-based oversight is weaker than often assumed.

## Reflections

This was my first fully-shipped eval project. Lessons for next time: scope the eval tightly before starting, and build the analysis pipeline *before* running expensive inference.
