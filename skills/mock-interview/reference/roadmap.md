# Interview Prep Roadmaps

The roadmap is **derived, not hand-listed**: each question's `section` in `data/*.js` is its band,
and `SECTION_ORDER` in `data/roadmaps.js` only fixes the band order per topic. A section missing
from that list is appended after the listed ones in data order, and a listed section with no
questions is dropped. Never keep a separate list of question ids for a path; read the sections from
the data at session time.

Band order (from `SECTION_ORDER` at the time of writing; re-read that file if it may have changed):

## Android (`data/android.js`, `tech-*`)

1. Kotlin
2. Android Core
3. Jetpack
4. Concurrency
5. Networking & Data
6. Architecture
7. Patterns & Principles
8. Performance & Security
9. Engineering
10. AI & Tooling

## Behavioral (`data/behavioral.js`, `behav-*`)

1. Ownership
2. Delivery
3. Collaboration
4. Growth & Culture
5. Leadership

## Data Structures and Algorithms (`data/data-structures.js`, `ds-*`)

1. Arrays & Strings
2. Hash Maps
3. Linked Lists
4. Stacks & Queues
5. Sorting & Searching
6. Trees & Graphs
7. Dynamic Programming
8. Concurrency

## System Design (`data/system-design.js`, `sd-*`)

1. Mobile
2. Classic
3. Architecture
4. Frontend
5. Staff / Platform

The app's roadmap pane orders cells within a band starred-first, then E -> M -> H
(`roadmapColumnOrder` in `view/app.js`); follow the same order when picking the next question.
