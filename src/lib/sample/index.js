/**
 * Sample project data for first run
 */
import { db, createProject, createDocument } from '@/lib/db';
import { createDocumentMarkdown, generateMarkdown } from '@/lib/markdown';
import { reindexProject } from '@/lib/reindexer';
import { v4 as uuidv4 } from 'uuid';

export async function createSampleProject() {
  const now = new Date().toISOString();

  // Create the project
  const projectId = await db.projects.add({
    name: 'The Midnight Garden',
    createdAt: now,
    updatedAt: now
  });

  // Chapter 1
  await db.documents.add({
    projectId,
    type: 'chapter',
    title: 'Chapter 1: The Discovery',
    status: 'revised',
    order: 0,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'chapter',
      title: 'Chapter 1: The Discovery',
      status: 'revised',
      order: 0,
      updated_at: now
    }, `# Chapter 1: The Discovery

The old iron gate creaked as Elena Vance pushed it open. She hadn't expected to find The Midnight Garden here, hidden behind the crumbling walls of her grandmother's estate.

Moonlight filtered through the ancient oaks, casting silver patterns across the overgrown path. The air smelled of night-blooming jasmine and something older—earth and secrets.

## The First Step

She moved cautiously, her footsteps muffled by decades of fallen leaves. The garden was larger than it appeared from outside, stretching impossibly far into the darkness.

A fountain stood at the center, dry now but carved with symbols she didn't recognize. Marcus Webb had mentioned something about this in his research notes—symbols that predated the estate by centuries.

"You shouldn't be here," a voice said from the shadows.

Elena spun around, her heart pounding. A figure emerged from behind a twisted hawthorn tree—The Gardener, though she didn't know that yet.
`),
    updatedAt: now
  });

  // Chapter 2
  await db.documents.add({
    projectId,
    type: 'chapter',
    title: 'Chapter 2: Old Friends',
    status: 'draft',
    order: 1,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'chapter',
      title: 'Chapter 2: Old Friends',
      status: 'draft',
      order: 1,
      updated_at: now
    }, `# Chapter 2: Old Friends

Marcus Webb arrived the next morning, his vintage sedan crunching on the gravel drive. He looked older than Elena remembered—it had been five years since their falling out at the university.

"You called," he said simply, stepping out of the car with a leather briefcase that bulged with papers.

## The Research

They spread his notes across the kitchen table. Years of research into The Midnight Garden—folklore, historical records, and stranger things.

"Your grandmother knew," Marcus explained. "She was the last in a long line of Keepers. And now..." He trailed off, looking at her meaningfully.

Elena shook her head. "I'm a botanist, Marcus. I study plants, not magic."

"What if I told you they're the same thing?"
`),
    updatedAt: now
  });

  // Scene
  await db.documents.add({
    projectId,
    type: 'scene',
    title: 'The Confrontation',
    status: 'draft',
    order: 2,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'scene',
      title: 'The Confrontation',
      status: 'draft',
      order: 2,
      updated_at: now
    }, `# The Confrontation

## Setting
The Midnight Garden, near the central fountain. Late night, full moon.

## Characters Present
- Elena Vance
- The Gardener

## Scene Goal
Elena demands answers about her grandmother and the garden's true nature.

## Draft

The Gardener circled the fountain slowly, trailing one gnarled finger along its edge. "Your grandmother made a bargain," he said. "As did her mother before her."

"What kind of bargain?"

"The garden feeds on stories. On potential. On the futures that never were." He stopped, facing her across the moonlit water. "In exchange, it gives protection. But the garden has grown hungry, and the old compact is ending."
`),
    updatedAt: now
  });

  // Character: Elena
  await db.documents.add({
    projectId,
    type: 'character',
    title: 'Elena Vance',
    status: 'revised',
    order: 0,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'character',
      title: 'Elena Vance',
      status: 'revised',
      order: 0,
      updated_at: now
    }, `# Elena Vance

## Overview
Protagonist. A 32-year-old botanist who inherits her grandmother's estate and discovers The Midnight Garden.

## Physical Description
- Dark hair, usually pulled back in a practical bun
- Green eyes (a family trait)
- Average height, athletic build from fieldwork
- Often wears practical clothes—jeans, boots, flannel shirts

## Personality
- Skeptical and scientific-minded
- Independent to a fault
- Deeply loyal once trust is established
- Struggles with asking for help

## Background
- PhD in botany from Ashworth University
- Estranged from family after her mother's death
- Former research partner and friend of Marcus Webb
- Never knew her grandmother well, but now inherits everything

## Goals & Motivations
- **Primary:** Understand the garden and her family's connection to it
- **Internal:** Reconnect with her past without losing herself
- **Fear:** Becoming trapped like her grandmother seemed to be

## Key Relationships
- Marcus Webb - former colleague, complicated history
- The Gardener - mysterious figure, unclear motives
`),
    updatedAt: now
  });

  // Character: Marcus
  await db.documents.add({
    projectId,
    type: 'character',
    title: 'Marcus Webb',
    status: 'draft',
    order: 1,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'character',
      title: 'Marcus Webb',
      status: 'draft',
      order: 1,
      updated_at: now
    }, `# Marcus Webb

## Overview
Secondary protagonist. A folklorist who has spent years researching The Midnight Garden and similar phenomena.

## Physical Description
- Mid-40s, graying at the temples
- Tall, thin, perpetually rumpled
- Wire-rimmed glasses
- Always carrying too many books

## Personality
- Obsessive about research
- Genuinely believes in the supernatural
- More empathetic than he appears
- Haunted by past mistakes

## Background
- Professor of Folklore at Ashworth University
- Was Elena Vance's thesis advisor
- Their falling out involved his insistence on pursuing "unscientific" research

## Goals & Motivations
- **Primary:** Prove that magic is real and document it
- **Secondary:** Make amends with Elena
- **Fear:** Being right about the dangers he's studied
`),
    updatedAt: now
  });

  // Character: The Gardener
  await db.documents.add({
    projectId,
    type: 'character',
    title: 'The Gardener',
    status: 'draft',
    order: 2,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'character',
      title: 'The Gardener',
      status: 'draft',
      order: 2,
      updated_at: now
    }, `# The Gardener

## Overview
Mysterious antagonist/ally. An ancient being bound to The Midnight Garden.

## Physical Description
- Appears as an elderly man in worn gardening clothes
- Features shift subtly—never quite the same twice
- Hands are earth-stained and bark-rough
- Eyes reflect moonlight like still water

## Personality
- Speaks in riddles and half-truths
- Neither good nor evil—serves the garden
- Shows flashes of something like regret
- Bound by rules he cannot break

## Background
- Origin unknown, possibly the garden's creation
- Has served Keepers for generations
- Remembers every bargain ever made

## Goals & Motivations
- **Primary:** Ensure the garden survives
- **Secondary:** Unclear—seems to want to help Elena
- **Fear:** The garden dying, being truly alone
`),
    updatedAt: now
  });

  // Location
  await db.documents.add({
    projectId,
    type: 'location',
    title: 'The Midnight Garden',
    status: 'revised',
    order: 0,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'location',
      title: 'The Midnight Garden',
      status: 'revised',
      order: 0,
      updated_at: now
    }, `# The Midnight Garden

## Overview
A supernatural garden hidden behind the Vance estate. Only fully visible and accessible at night.

## Atmosphere
- Perpetual twilight feel, even on sunny days
- Air thick with floral scents that shift with mood
- Time moves differently inside
- Sound is muffled—the outside world feels distant

## Key Features
- **The Gate:** Wrought iron, marked with old symbols
- **The Path:** Winds impossibly, longer than physics allows
- **The Fountain:** Central feature, carved with unknown script
- **The Hawthorn Maze:** A labyrinth that changes configuration
- **The Greenhouse:** Where impossible plants grow

## History
- Predates the Vance estate by centuries
- Connected to the line of Keepers
- Fed by stories, memories, and "might-have-beens"
- The source of the family's prosperity—and curse

## Story Role
The primary setting and a character in its own right. The garden has agency and desires.
`),
    updatedAt: now
  });

  // Theme
  await db.documents.add({
    projectId,
    type: 'theme',
    title: 'Legacy and Inheritance',
    status: 'draft',
    order: 0,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'theme',
      title: 'Legacy and Inheritance',
      status: 'draft',
      order: 0,
      updated_at: now
    }, `# Legacy and Inheritance

## Description
The story explores what we inherit from our families—not just property and genetics, but obligations, secrets, and unfinished business.

Elena Vance must decide whether to accept her role as Keepers|Keeper or break the chain. Either choice has consequences.

## Key Scenes
- Elena discovering her grandmother's journals
- Marcus Webb explaining the history of Keepers
- The revelation of what Elena's mother gave up
- Final confrontation: accepting or rejecting the legacy

## Character Connections
- **Elena:** Must choose whether to continue her family's work
- **Marcus:** Represents chosen legacy vs. inherited
- **The Gardener:** Living reminder that some bargains outlast generations

## Symbols
- The garden gate (threshold between old and new)
- The fountain (bargains written in stone)
- Night-blooming flowers (beauty that requires darkness)
`),
    updatedAt: now
  });

  // Style Guide
  await db.documents.add({
    projectId,
    type: 'theme',
    title: 'Style Guide',
    status: 'revised',
    order: 1,
    markdown: generateMarkdown({
      id: uuidv4(),
      type: 'theme',
      title: 'Style Guide',
      status: 'revised',
      order: 1,
      updated_at: now
    }, `# Style Guide

## Voice and Tone
- Third person limited, primarily Elena's POV
- Literary but accessible
- Atmospheric without purple prose
- Dialogue should feel natural, slightly formal for The Gardener

## Pacing
- Slow burn mystery
- Each chapter should reveal one new piece of the puzzle
- Balance introspection with action
- End chapters on questions, not answers

## World Rules
- Magic operates on bargains and exchanges
- Nothing is free; everything has a price
- The garden responds to emotion and intent
- Time in the garden is unreliable

## Things to Avoid
- Info dumps about the garden's history
- Making The Gardener too villainous or too helpful
- Easy answers or quick fixes
- Modern technology intruding on the atmosphere

## Reference Works
- *The Secret Garden* (Frances Hodgson Burnett)
- *Piranesi* (Susanna Clarke)  
- *The Night Circus* (Erin Morgenstern)
`),
    updatedAt: now
  });

  // Reindex to build links and entities
  await reindexProject(projectId);

  return projectId;
}
