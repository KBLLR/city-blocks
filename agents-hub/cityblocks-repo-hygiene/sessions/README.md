# Session Logs

Store every working-session log for this project in this directory. Name each file with the start timestamp for easy sorting, e.g.:

- `2025-02-14T09-30-session.md`
- `2025-02-14T14-15-session.md`

## How to Log a Session
1. Use the helper CLI:
   ```bash
   pnpm run new:session "Describe objective"
   pnpm run new:session -- --diff "Add joystick control"
   ```
   (The script copies `sessions/session-template.md`, stamps the timestamp, and optionally appends `git diff --name-only`.)
2. Fill in every field:
   - Date, start/end time, elapsed time.
   - Objectives, execution notes, errors, decisions, learnings.
   - Session quote and image prompt.
3. Save before committing any code from that session.

Each session entry should include:

- **Task IDs** (e.g., `PROJ-101`)
- **Models consulted** (Ollama, Gemini, Claude, etc.)
- **Image/Prompt IDs** from the prompt library
- **Capability flags** touched
- **Lint/Test status** (result of `pnpm run check`)
- **Reflection (Good/Bad/Ugly)** snapshot
- **Image prompt details** (prompt ID + tweaks; follow prompts template: subject + style + medium + mood)
- **Quote** capturing the tone
- **Next actions** for the handoff

## Linking Sessions to Tasks
- Reference relevant task IDs (from `../tasks.md`) in the “Associated Tasks / Issues” field.
- When closing a task, link the supporting session logs in the task notes.

> Consistent logging keeps reviews tight and gives future contributors a play-by-play of significant changes.
