# Task Ledger — CityBlocks Setup

## Backlog
| ID | Title | Description | Priority | Owner | Notes |
|----|-------|-------------|----------|-------|-------|
| CBS-103 | Remove remaining `any` types in Home scene | Replace temporary anys with typed helpers for footprints/materials so lint passes. | Medium | @davidcaballero | Research: react-three type safety |
| CBS-104 | LLM provider expansion | Wire Gemini, Hugging Face, and Ollama inference paths once APIs are confirmed. | Low | @davidcaballero | Research: Gemini client, HuggingFace Inference API, Ollama auth |

## In Progress
| ID | Title | Started | Owner | Notes |
|----|-------|---------|-------|-------|

## Review / QA
| ID | Title | PR / Branch | Reviewer | Notes |
|----|-------|-------------|----------|-------|

## Done
| ID | Title | Completed | Outcome |
|----|-------|-----------|---------|
| CBS-101 | Reset dependencies and remove Mocha tooling | 2025-11-09 | Project renamed to `cityblocks`, Mocha plugins removed, deps bumped, README refreshed. |
| CBS-102 | Add local API key manager + worker headers | 2025-11-09 | Floating key button stores OpenAI/Gemini/HF/Ollama keys locally; worker trusts request headers. |
