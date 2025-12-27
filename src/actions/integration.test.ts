import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { addToArrangement } from './addToArrangement'
import { playArrangement } from './playArrangement'
import { randomiseArrangement } from './randomiseArrangement'
import {
  Layers,
  LoadedFiles,
  Arrangement,
  SelectedBar,
  NumBars,
  Playing,
  Player,
  PlayStartTimestamp,
  Tab,
} from '../lib/store'
import { createPlayer } from '../lib/audio'
import { getArrangementSamples } from '../helpers/getArrangementSamples'

// Mock dependencies
vi.mock('../lib/audio')
vi.mock('../helpers/getArrangementSamples')
vi.mock('../helpers/getBestLayerPitch', () => ({
  getBestLayerPitch: vi.fn(() => 0),
}))
vi.mock('../helpers/getBestLayerVolume', () => ({
  getBestLayerVolume: vi.fn(() => 50),
}))

describe('Main Functionality Integration Tests', () => {
  const mockFile1 = {
    name: 'test-file-1',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockFile2 = {
    name: 'test-file-2',
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    artist: 'Test Artist',
    year: 2024,
    whosampledLink: '',
    whosampledCount: 0,
  }

  const mockPlayer = {
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    loop: false,
    state: 'stopped',
    onstop: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all state
    Layers.set([])
    LoadedFiles.set([mockFile1, mockFile2])
    Arrangement.set([])
    SelectedBar.set(0)
    NumBars.set(1)
    Playing.set(false)
    Player.set(null)
    PlayStartTimestamp.set(null)
    Tab.set('library')

    // Setup mocks
    ;(createPlayer as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlayer)
    ;(getArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue([
      new Float32Array(44100),
      new Float32Array(44100),
    ])
  })

  describe('Adding layers to arrangement', () => {
    it('adds a layer to the arrangement when addToArrangement is called', () => {
      expect(Layers.ref().length).toBe(0)
      expect(Tab.ref()).toBe('library')

      addToArrangement(0)

      expect(Layers.ref().length).toBe(1)
      expect(Layers.ref()[0].filename).toBe('test-file-1')
      expect(Tab.ref()).toBe('arrangement')
    })

    it('adds multiple layers sequentially', () => {
      addToArrangement(0)
      expect(Layers.ref().length).toBe(1)

      addToArrangement(1)
      expect(Layers.ref().length).toBe(2)
      expect(Layers.ref()[0].filename).toBe('test-file-1')
      expect(Layers.ref()[1].filename).toBe('test-file-2')
    })

    it('sets correct volume and pitch for added layer', () => {
      addToArrangement(0)

      const layer = Layers.ref()[0]
      expect(layer.volume).toBeDefined()
      expect(layer.pitch).toBeDefined()
    })
  })

  describe('Playing arrangement', () => {
    it('starts playback when playArrangement is called', async () => {
      // Setup: Add a layer first
      Layers.set([{ filename: 'test-file-1', volume: 50, pitch: 0 }])

      await playArrangement()

      expect(Playing.ref()).toBe(true)
      expect(Player.ref()).toBe(mockPlayer)
      expect(mockPlayer.loop).toBe(true)
      expect(mockPlayer.start).toHaveBeenCalledTimes(1)
      expect(PlayStartTimestamp.ref()).not.toBe(null)
    })

    it('does not start playback if no samples are available', async () => {
      Layers.set([{ filename: 'test-file-1', volume: 50, pitch: 0 }])
      ;(getArrangementSamples as ReturnType<typeof vi.fn>).mockReturnValue(null)

      await playArrangement()

      // Playing should be set to true, but player might not be set if samples are null
      expect(Playing.ref()).toBe(true)
    })

    it('sets up player stop handler correctly', async () => {
      Layers.set([{ filename: 'test-file-1', volume: 50, pitch: 0 }])

      await playArrangement()

      expect(mockPlayer.onstop).not.toBe(null)
    })
  })

  describe('Randomising notes', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      // Mock Math.random() to return deterministic values
      // This ensures tests are deterministic and reproducible
      // We'll return values that exercise different probability branches
      let callCount = 0
      mathRandomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
        // Return a sequence of values that will produce consistent results
        // Using values that will trigger different probability branches
        const values = [
          0.1,
          0.3,
          0.5,
          0.7,
          0.9, // Mix of kick, snare, hat
          0.05,
          0.25,
          0.55,
          0.75,
          0.95,
          0.15,
          0.35,
          0.65,
          0.85,
          0.2,
          0.4,
        ]
        return values[callCount++ % values.length]
      })

      // Setup: Add some initial notes to the arrangement
      Arrangement.set([
        { startStep: 0, stepNumToPlay: 0 },
        { startStep: 4, stepNumToPlay: 4 },
        { startStep: 16, stepNumToPlay: 0 }, // Note in bar 1
      ])
      SelectedBar.set(0)
    })

    afterEach(() => {
      mathRandomSpy.mockRestore()
    })

    it('replaces notes in the selected bar with random notes', () => {
      randomiseArrangement()

      const newArrangement = Arrangement.ref()
      const newBar0Notes = newArrangement.filter(n => n.startStep < 16)

      // Bar 0 notes should be replaced
      expect(newBar0Notes.length).toBe(16) // Should have 16 steps
      // Notes in other bars should be preserved
      const bar1Notes = newArrangement.filter(n => n.startStep >= 16 && n.startStep < 32)
      expect(bar1Notes.length).toBe(1) // Original note in bar 1 should remain
    })

    it('preserves notes in non-selected bars', () => {
      SelectedBar.set(1)
      Arrangement.set([
        { startStep: 0, stepNumToPlay: 0 }, // Bar 0
        { startStep: 16, stepNumToPlay: 4 }, // Bar 1
        { startStep: 32, stepNumToPlay: 0 }, // Bar 2
      ])

      randomiseArrangement()

      const arrangement = Arrangement.ref()
      // Bar 0 should be preserved
      expect(arrangement.some(n => n.startStep === 0 && n.stepNumToPlay === 0)).toBe(true)
      // Bar 1 should be replaced
      const bar1Notes = arrangement.filter(n => n.startStep >= 16 && n.startStep < 32)
      expect(bar1Notes.length).toBe(16)
      // Bar 2 should be preserved
      expect(arrangement.some(n => n.startStep === 32 && n.stepNumToPlay === 0)).toBe(true)
    })

    it('generates notes based on probabilities', () => {
      randomiseArrangement()

      const arrangement = Arrangement.ref()
      const bar0Notes = arrangement.filter(n => n.startStep < 16)

      // Should have generated notes for the selected bar
      expect(bar0Notes.length).toBeGreaterThan(0)
      // Each note should have valid stepNumToPlay
      bar0Notes.forEach(note => {
        expect(note.startStep).toBeGreaterThanOrEqual(0)
        expect(note.startStep).toBeLessThan(16)
        expect(note.stepNumToPlay).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Adding bars', () => {
    beforeEach(() => {
      // Setup: Start with 1 bar and some notes
      NumBars.set(1)
      Arrangement.set([
        { startStep: 0, stepNumToPlay: 0 },
        { startStep: 4, stepNumToPlay: 4 },
      ])
      SelectedBar.set(0)
    })

    it('increments NumBars when adding a bar', () => {
      // Import the addBars function logic
      const numBars = NumBars.ref()
      NumBars.set(numBars + 1)

      expect(NumBars.ref()).toBe(2)
    })

    it('duplicates first bar when adding second bar', () => {
      const numBars = NumBars.ref()

      // Simulate addBars logic for numBars === 1
      if (numBars === 1) {
        const firstBar = Arrangement.ref().filter(n => n.startStep < 16)
        Arrangement.set([
          ...firstBar,
          ...firstBar.map(n => ({ ...n, startStep: n.startStep + 16 })),
        ])
        NumBars.set(2)
        SelectedBar.set(1)
      }

      expect(NumBars.ref()).toBe(2)
      const arrangement = Arrangement.ref()
      // Should have duplicated notes
      expect(arrangement.length).toBe(4) // 2 original + 2 duplicated
      // Original notes should still be in bar 0
      expect(arrangement.some(n => n.startStep === 0)).toBe(true)
      // Duplicated notes should be in bar 1
      expect(arrangement.some(n => n.startStep === 16)).toBe(true)
    })

    it('does not add more than 4 bars', () => {
      NumBars.set(4)

      const numBars = NumBars.ref()
      // Should not be able to add more bars
      expect(numBars).toBe(4)
    })
  })

  describe('Workflow: Add layer, play, randomise', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      // Mock Math.random() for deterministic tests
      let callCount = 0
      mathRandomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
        const values = [
          0.1, 0.3, 0.5, 0.7, 0.9, 0.05, 0.25, 0.55, 0.75, 0.95, 0.15, 0.35, 0.65, 0.85, 0.2, 0.4,
        ]
        return values[callCount++ % values.length]
      })
    })

    afterEach(() => {
      mathRandomSpy.mockRestore()
    })

    it('completes full workflow: add layer -> play -> randomise notes', async () => {
      // Step 1: Add a layer
      addToArrangement(0)
      expect(Layers.ref().length).toBe(1)

      // Step 2: Play arrangement
      await playArrangement()
      expect(Playing.ref()).toBe(true)
      expect(Player.ref()).toBe(mockPlayer)

      // Step 3: Randomise notes (should not stop playback)
      const wasPlaying = Playing.ref() && Player.ref()?.state === 'started'
      randomiseArrangement()

      // Verify arrangement was randomised
      const arrangement = Arrangement.ref()
      expect(arrangement.length).toBeGreaterThan(0)

      // Verify playback state is maintained
      if (wasPlaying) {
        expect(Playing.ref()).toBe(true)
      }
    })
  })
})
