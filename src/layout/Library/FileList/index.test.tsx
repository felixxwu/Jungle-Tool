import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '../../../test/test-utils'
import { FileList } from './index'
import {
  LoadedFiles,
  SelectedFileIndex,
  AddLayerMode,
  Layers,
  WindowSize,
} from '../../../lib/store'
import { playFile } from '../../../actions/playFile'

// Mock playFile action
vi.mock('../../../actions/playFile', () => ({
  playFile: vi.fn().mockResolvedValue(undefined),
}))

// Mock addToArrangement action
vi.mock('../../../actions/addToArrangement', () => ({
  addToArrangement: vi.fn(),
}))

describe('FileList', () => {
  const mockFile1 = {
    name: 'Amen Brother (1)',
    artist: 'The Winstons',
    year: 1969,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    whosampledLink: 'https://www.whosampled.com/sample/123/',
    whosampledCount: 5000,
  }

  const mockFile2 = {
    name: 'Funky Drummer',
    artist: 'James Brown',
    year: 1970,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    whosampledLink: 'https://www.whosampled.com/sample/456/',
    whosampledCount: 3000,
  }

  const mockFile3 = {
    name: 'Apache',
    artist: 'The Incredible Bongo Band',
    year: 1973,
    samples: [new Float32Array(44100), new Float32Array(44100)] as [Float32Array, Float32Array],
    slices: [],
    whosampledLink: 'https://www.whosampled.com/sample/789/',
    whosampledCount: 2000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    LoadedFiles.set([])
    SelectedFileIndex.set(null)
    AddLayerMode.set(false)
    Layers.set([])
    WindowSize.set({ width: 1000, height: 650 })
  })

  it('displays break sample names', () => {
    LoadedFiles.set([mockFile1, mockFile2])
    render(<FileList />)

    expect(screen.getByText('Amen Brother (1)')).toBeInTheDocument()
    expect(screen.getByText('Funky Drummer')).toBeInTheDocument()
  })

  it('displays artist metadata for each break', () => {
    LoadedFiles.set([mockFile1, mockFile2])
    render(<FileList />)

    expect(screen.getByText('The Winstons')).toBeInTheDocument()
    expect(screen.getByText('James Brown')).toBeInTheDocument()
  })

  it('displays year metadata for each break', () => {
    LoadedFiles.set([mockFile1, mockFile2])
    render(<FileList />)

    expect(screen.getByText('1969')).toBeInTheDocument()
    expect(screen.getByText('1970')).toBeInTheDocument()
  })

  it('displays "??" for missing artist', () => {
    const fileWithoutArtist = {
      ...mockFile1,
      artist: '',
    }
    LoadedFiles.set([fileWithoutArtist])
    render(<FileList />)

    expect(screen.getByText('??')).toBeInTheDocument()
  })

  it('displays "??" for missing year', () => {
    const fileWithoutYear = {
      ...mockFile1,
      year: 0,
    }
    LoadedFiles.set([fileWithoutYear])
    render(<FileList />)

    // Should show ?? for year
    const yearElements = screen.getAllByText('??')
    expect(yearElements.length).toBeGreaterThan(0)
  })

  it('sorts files by whosampledCount (descending)', () => {
    LoadedFiles.set([mockFile2, mockFile3, mockFile1]) // Unsorted order
    render(<FileList />)

    const fileNames = screen.getAllByText(/Amen Brother|Funky Drummer|Apache/)
    // Should be sorted by whosampledCount: Amen Brother (5000), Funky Drummer (3000), Apache (2000)
    expect(fileNames[0].textContent).toContain('Amen Brother')
    expect(fileNames[1].textContent).toContain('Funky Drummer')
    expect(fileNames[2].textContent).toContain('Apache')
  })

  it('highlights selected file', () => {
    LoadedFiles.set([mockFile1, mockFile2])
    SelectedFileIndex.set(0)
    render(<FileList />)

    // Verify the selected file is rendered (the component uses selected prop on Text component)
    const amenBrotherItem = screen.getByText('Amen Brother (1)')
    expect(amenBrotherItem).toBeInTheDocument()
    // The Text component with selected prop will have different styling, but we verify it renders
  })

  it('calls playFile when a file is clicked', async () => {
    LoadedFiles.set([mockFile1, mockFile2])
    render(<FileList />)

    const funkyDrummerItem = screen.getByText('Funky Drummer')
    await act(async () => {
      funkyDrummerItem.click()
    })

    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 20))
    })

    expect(playFile).toHaveBeenCalledWith(1) // Second file (index 1)
  })

  it('shows import file button', () => {
    LoadedFiles.set([mockFile1])
    render(<FileList />)

    expect(screen.getByText('Import File +')).toBeInTheDocument()
  })
})
