import type { SurveyCategory, SurveyItem } from '../lib/types'

export const SURVEY_CATEGORIES: readonly SurveyCategory[] = [
  'Functional Suitability',
  'Reliability',
  'Usability',
  'Performance Efficiency',
  'Portability',
]

/** Index 0 is the value 1. A five point agreement scale. */
export const LIKERT: readonly string[] = [
  'Strongly disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly agree',
]

/**
 * The evaluation instrument. Four items per category, twenty in all.
 * Every item is worded so that agreeing is the favourable answer, because
 * a mixed direction invites a student to tick one column down the page and
 * makes the reversed items look like disagreement in the raw table.
 */
export const SURVEY: SurveyItem[] = [
  { id: 'fs1', category: 'Functional Suitability', text: 'The app covers the EPAS topics I need for this subject.' },
  { id: 'fs2', category: 'Functional Suitability', text: 'The lessons match what our Budget of Work says we should learn.' },
  { id: 'fs3', category: 'Functional Suitability', text: 'The simulations behave the way the real equipment does.' },
  { id: 'fs4', category: 'Functional Suitability', text: 'The app does what I expect it to do when I use it.' },

  { id: 'rl1', category: 'Reliability', text: 'The app keeps working without crashing or freezing.' },
  { id: 'rl2', category: 'Reliability', text: 'My answers and my progress are still there when I come back to it.' },
  { id: 'rl3', category: 'Reliability', text: 'The app keeps working when the internet connection drops.' },
  { id: 'rl4', category: 'Reliability', text: 'The app is ready to use whenever I open it.' },

  { id: 'us1', category: 'Usability', text: 'I could work out how to use the app without being taught.' },
  { id: 'us2', category: 'Usability', text: 'It is easy to find the module or the lesson I am looking for.' },
  { id: 'us3', category: 'Usability', text: 'The text and the diagrams are easy to read on my device.' },
  { id: 'us4', category: 'Usability', text: 'The app looks clear and tidy rather than cluttered.' },

  { id: 'pe1', category: 'Performance Efficiency', text: 'The app opens quickly on my device.' },
  { id: 'pe2', category: 'Performance Efficiency', text: 'Screens and simulations respond without me having to wait.' },
  { id: 'pe3', category: 'Performance Efficiency', text: 'The app does not slow my device down while I am using it.' },
  { id: 'pe4', category: 'Performance Efficiency', text: 'The app still works well on an older or cheaper phone.' },

  { id: 'po1', category: 'Portability', text: 'The app works on the device I normally use.' },
  { id: 'po2', category: 'Portability', text: 'The app fits the screen of the device I use without zooming or scrolling sideways.' },
  { id: 'po3', category: 'Portability', text: 'Getting the app open on my device was straightforward.' },
  { id: 'po4', category: 'Portability', text: 'I could use this app in place of a printed module or handout.' },
]
