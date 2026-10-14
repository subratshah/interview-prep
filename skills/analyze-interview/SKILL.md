---
name: analyze-interview
description: Analyse a real interview from its transcript — clean the transcript, grade every question, write a report with action items, and fold the lessons into a running playbook. Use when the user pastes or points to an interview transcript/recording notes and says "analyse my interview", "grade this round", "what went wrong", or "update my playbook".
---

# analyze-interview

## Purpose

Turn one real interview round into three durable outputs: a cleaned transcript, a graded report, and
an updated cumulative playbook. The report is honest grading against what a strong answer contains,
not encouragement.

## Where things live

- Everything goes in `.interview/` (gitignored by `.*/` — it holds company names, interviewer details
  and compensation, so **never** copy it into `data/`, notes, commits or anything tracked).
- One folder per process: `.interview/MM-DD_<company>-<role>/` (reuse the folder if the company
  already has one; dates are the first round's).
- Files per round, dated by the round:
  - `MM-DD_transcript_<round>.md` — cleaned transcript
  - `MM-DD_report_<round>.md` — graded report (`reference/report-format.md`)
- Playbook: `.interview/playbook.md` — one cumulative file across all interviews (`reference/playbook.md`).

## Workflow

1. **Collect input.** Transcript text (paste, file, or machine transcription), company, role, round
   type, date, and the outcome if known. Ask for anything missing in one message. Do not ask how it was
   transcribed; if the user only has audio, say a transcript is needed (any dictation/transcription
   tool works) and stop.
2. **Clean the transcript.** Join multiple pastes in time order, label speakers (Interviewer /
   Candidate), fix transcription errors that change meaning, and list every fix in an appendix
   ("vote token" → "auth token"). Mark lines you could not resolve as unresolved — never guess.
   Write `MM-DD_transcript_<round>.md`.
3. **Grade.** Split the round into items (one per question or follow-up). For each: what was asked,
   a short paraphrase of what was answered, a grade (Correct / Mostly / Partial / Wrong-or-not-answered),
   and what a strong answer adds. Check technical claims against primary docs when unsure; label
   anything you could not verify. Score with the weights in the report format.
4. **Map to the question bank.** For every item, find matching questions with the palette-style
   search over `data/*.js` (title, tags, body). Cite ids (`tech-42`, `sd-17`). Items with no match
   become "bank gaps" — propose new questions only; adding them is a separate step the user approves,
   using generic wording (never the interviewer's exact wording if an NDA was mentioned).
5. **Write the report** (`reference/report-format.md`), ending in Immediate / Short-term / Long-term
   action items and one `#### Next action:`.
6. **Update the playbook** (`reference/playbook.md`): add the round to Performance Tracking,
   recompute the trend, and merge — not append — new strengths, weaknesses, pitfalls, clarifying
   questions and phrases. Create the file from the template if it does not exist.
7. **Report back** in chat: score, the three biggest gaps, bank gaps, and file paths.

## Rules

- Grade what was said, not what the candidate meant. Quote sparingly; paraphrase instead.
- Never add recruiter/HR details, compensation or interviewer identity to tracked files.
- If the interviewer stated an NDA, flag it in the report and check what is about to be pushed.
- Don't overwrite an earlier report — a re-grade gets a new dated file.
