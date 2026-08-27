# Work management platform alternative

_Started 2026-08-24 22:49 UTC_

---

## User

A monday dot com alternative, I dont need the GANT or agent addons, i really just want solid work management platform that can be colaborative

## Assistant



## Assistant

_[tool: list_files]_

_[tool: ask_user]_

Form's up — waiting on your answers on audience, views, collaboration model, and scope before I build.

## User

Answered — team: Marketing/creative — campaigns, assets, approvals, Ops/manufacturing — orders, schedules, tickets, Agency/client services — client projects, deliverables; views: Table/board hybrid (grouped rows), Kanban board, Calendar, Timeline (light, not Gantt), My Work / personal queue, Dashboard of metrics, Workload by person; collab: @mentions + notifications, File attachments + previews, Shared inbox of updates, Guest/client access; scope: 3-4 key screens; fidelity: Static mockup; item_model: Task, Timeline (Date range), Priority, Label, Assigned, Notes

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

**Cadence** — four screens on Nocturne, no Gantt, no agents:

1. **Board** — grouped table (Task / Timeline / Priority / Label / Assigned / Notes) with the item panel open: files, threaded updates, @mentions, a client guest in the thread.
2. **Kanban** — same tasks by stage, intake → shipped, with a client-approval column.
3. **Calendar + light timeline** — month grid plus six-week campaign bars, no dependency arrows.
4. **My work / workload / updates** — personal queue, per-person load, shared update inbox.

Grouping (Campaign / Client / Status) and the product name are tweakable. Say the word if you want it clickable rather than static.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Fixed: board frame no longer clips the last group, calendar now starts on the correct Monday-aligned Aug 1, timeline/name cells no longer wrap, Kanban frame tightened, and the design-system bundle is loaded.

