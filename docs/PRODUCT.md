# PRODUCT.md

Product context for the EPAS Interactive Learning App. Derived from the design interview of 2026-09-06; see `docs/superpowers/specs/2026-09-06-epas-learning-app-design.md` for the full specification.

## What this is

An offline-capable installable web app that teaches the DepEd TechPro Grade 12 elective *Electronics Product Assembly and Servicing*, and simultaneously collects the learning-gain and acceptability data its author needs for a research submission.

## Who it is for

**Primary: Grade 12 TVL students.** Filipino senior high school learners taking the EPAS elective. They access the app on their own phones, often low-end Android, and on shared lab PCs. Mobile data is a real cost to them and school Wi-Fi is unreliable. Many will use the app in a workshop while standing at a bench, not seated at a desk.

**Secondary: the teacher-researcher.** The author of the app. Teaches the elective, needs the app both as a classroom resource and as the instrument for a research paper. Collects student result files and merges them for analysis.

**Tertiary: expert validators.** Teachers and IT evaluators who will rate the system through the built-in ISO/IEC 25010 survey.

## Why it exists

Two problems at once.

Schools running this elective frequently lack enough working equipment for every student to practise testing components, assembling a regulated power supply, or diagnosing a faulty appliance. Simulation substitutes for scarce equipment, so every student gets repetitions instead of watching one demonstration.

Separately, the teacher needs defensible evidence of learning for a research submission. Building the instrumentation into the same data path as the learning activity means the numbers describe what students actually did, rather than a separate test bolted on afterwards.

## Constraints

- **Must work with no internet.** After a single first load, everything runs offline. No CDN, no external assets, no runtime network dependency.
- **Must run on low-end Android phones.** SVG rather than canvas or WebGL, minimal animation, small bundle.
- **No accounts, no server, no student data leaving the device** unless the student exports it deliberately.
- **Curriculum fidelity.** Structure follows the published Budget of Work week by week; competency text is quoted, not paraphrased.
- **Safety.** The subject involves live mains voltage. Content that a student might act on physically must be reviewable and must declare its review status.

## What success looks like

- A student can complete a module's lessons, practise on its simulation, and pass its post-test on a phone with aeroplane mode on.
- The teacher can drop a class's exported files into the app and get one analysis-ready CSV with pre, post and gain per competency.
- The app has a stable URL citable in the paper.
- A panel reviewing the work sees an artifact that reads as a designed educational product, not a generic template.

## Platform

Web. Installable PWA. Deployed to a static host. No native app, no backend.

## Explicitly not

Not an LMS. No accounts, roster, or grading workflow. Not a circuit design tool. Not a replacement for physical shop work; performance tasks stay physical and the app says so.
