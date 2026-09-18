---
version: 1
slug: "src-routes-modulemap-tsx"
primary_target: "src/routes/ModuleMap.tsx"
related_targets: ["src/ui/Shell.tsx","src/interactives/SystemTroubleshooter.tsx"]
---

# Student app: Shadow Board

**Scope.** Every student-facing route (module map, module overview, lessons, quizzes, tests, labs, progress, consent, evaluate, task sheets, teacher screen) plus the Shell. The eight fault-diagnosis labs (`SystemTroubleshooter`) carry a scoped second world, Service Mode.

**Mode.** Operate for the app as a whole; the module map is the one screen allowed a Persuade moment (the opening drop).

**Audience and job.** Grade 12 EPAS students on low-end phones in a workshop, often with no signal. Find your place, start or continue the next module, practise faults without equipment.

**Constraints.** Offline, no CDN, no WebGL. Red only for safety. No em dashes. 44px targets. Reduced motion honoured. No surface may carry an answer (see CLAUDE.md). Consent gate stays in Shell.

**Memorable moment.** On first open of the module map, the tools drop onto their hooks with a spring; any input finishes it. In a troubleshooting lab, the customer's complaint types out in a pixel window.

**Unresolved.** None.

## Direction contract

THESIS: The app is a technician's pegboard. Each module is a tool with a painted outline; finishing it hangs the tool in place. Refuses the pastel card grid of LMS dashboards.

OWN-WORLD: Perforated board (#E3E8E4 light, #24302A dark), holes on one pitch that is the layout grid. Embossed label-tape headings in Barlow Condensed. Painted outlines. One yellow painted-steel plate (#F2C230) per screen for the primary action. Steel-filled Phosphor tools. Atkinson Hyperlegible Next body. Troubleshooting labs switch to Service Mode: sixteen-colour pixel shop, DotGothic16, double-rule windows.

STORY: A student sees nine tools, knows where they stand, starts or continues the next module with no signal, and watches tools hang as modules finish.

FIRST VIEWPORT: Module map: tape headline top-left, plate "Start module N" beneath it, lamp-lit 3x3 board right on desktop and below on phones.

FORM: Shadow Board, ranked 4 and assigned, seed 69d8323d. Service Mode challenger, scoped to fault labs.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
