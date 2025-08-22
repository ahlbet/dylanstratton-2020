import React from 'react'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react'
import { AllPostsTable } from './AllPostsTable'

// Mock Gatsby Link component
jest.mock('gatsby', () => ({
  Link: ({ to, children, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

const mockPosts = [
  {
    id: 'post-1',
    title: 'First Post',
    date: 'January 01, 2024',
    content: 'This is the first post content',
    daily_id: 'daily-1',
    cover_art: '',
    audio: [],
    markovTexts: [],
  },
  {
    id: 'post-2',
    title: 'Second Post',
    date: 'January 02, 2024',
    content: 'This is the second post content',
    daily_id: 'daily-2',
    cover_art: '',
    audio: [],
    markovTexts: [],
  },
  {
    id: 'post-3',
    title: 'Third Post',
    date: 'January 03, 2024',
    content: 'This is the third post content',
    daily_id: 'daily-3',
    cover_art: '',
    audio: [],
    markovTexts: [],
  },
  {
    id: 'post-4',
    title: 'Fourth Post',
    date: 'January 04, 2024',
    content: 'This is the fourth post content',
    daily_id: 'daily-4',
    cover_art: '',
    audio: [],
    markovTexts: [],
  },
  {
    id: 'post-5',
    title: 'Fifth Post',
    date: 'January 05, 2024',
    content: 'This is the fifth post content',
    daily_id: 'daily-5',
    cover_art: '',
    audio: [],
    markovTexts: [],
  },
]

const defaultProps = {
  posts: mockPosts,
  currentBlogPost: null,
  onPostClick: jest.fn(),
  searchTerm: '',
  onSearchChange: jest.fn(),
  sortDirection: 'desc' as const,
  onSortChange: jest.fn(),
  currentPage: 1,
  onPageChange: jest.fn(),
  totalPages: 1,
  totalCount: 5,
  postsPerPage: 10,
}

describe('AllPostsTable', () => {
  afterEach(() => {
    cleanup()
    jest.clearAllMocks()
  })

  test('renders all posts by default', () => {
    render(<AllPostsTable {...defaultProps} />)

    expect(screen.getByText('First Post')).toBeInTheDocument()
    expect(screen.getByText('Second Post')).toBeInTheDocument()
    expect(screen.getByText('Third Post')).toBeInTheDocument()
    expect(screen.getByText('Fourth Post')).toBeInTheDocument()
    expect(screen.getByText('Fifth Post')).toBeInTheDocument()
  })

  test('shows correct results info', () => {
    render(<AllPostsTable {...defaultProps} />)

    expect(screen.getByText('Showing 1-5 of 5 days')).toBeInTheDocument()
  })

  test('highlights current blog post', () => {
    const propsWithCurrentPost = {
      ...defaultProps,
      currentBlogPost: mockPosts[1],
    }
    render(<AllPostsTable {...propsWithCurrentPost} />)

    const secondPostCard = screen
      .getByText('Second Post')
      .closest('[data-slot="card"]')
    expect(secondPostCard).toHaveClass('border-red-400', 'bg-black-900')
  })

  test('calls onSearchChange when search input changes', () => {
    render(<AllPostsTable {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText(
      'Search days by title, content, or date...'
    )
    fireEvent.change(searchInput, { target: { value: 'test' } })

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test')
  })

  test('displays search term in results info when provided', () => {
    const propsWithSearch = { ...defaultProps, searchTerm: 'test' }
    render(<AllPostsTable {...propsWithSearch} />)

    expect(screen.getByText(/matching "test"/)).toBeInTheDocument()
  })

  test('calls onSortChange when sort button is clicked', () => {
    render(<AllPostsTable {...defaultProps} />)

    const sortButton = screen.getByLabelText('Toggle sort direction')
    fireEvent.click(sortButton)

    expect(defaultProps.onSortChange).toHaveBeenCalled()
  })

  test('displays correct sort icon based on sortDirection', () => {
    const propsWithAscSort = { ...defaultProps, sortDirection: 'asc' as const }
    render(<AllPostsTable {...propsWithAscSort} />)

    const sortButton = screen.getByLabelText('Toggle sort direction')
    expect(sortButton).toBeInTheDocument()
  })

  test('calls onPostClick when post is clicked', () => {
    render(<AllPostsTable {...defaultProps} />)

    const firstPost = screen.getByText('First Post')
    fireEvent.click(firstPost)

    expect(defaultProps.onPostClick).toHaveBeenCalledWith(mockPosts[0])
  })

  test('shows no results message when posts array is empty', () => {
    const propsWithNoPosts = { ...defaultProps, posts: [], totalCount: 0 }
    render(<AllPostsTable {...propsWithNoPosts} />)

    expect(
      screen.getByText('No days found matching your search criteria.')
    ).toBeInTheDocument()
  })

  test('calls onSearchChange and onPageChange when clear search button is clicked', () => {
    const propsWithSearch = {
      ...defaultProps,
      searchTerm: 'test',
      posts: [],
      totalCount: 0,
    }
    render(<AllPostsTable {...propsWithSearch} />)

    const clearButton = screen.getByText('Clear Search')
    fireEvent.click(clearButton)

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('')
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1)
  })

  test('calls onPageChange when pagination buttons are clicked', () => {
    const propsWithPagination = {
      ...defaultProps,
      totalPages: 3,
      totalCount: 25,
    }
    render(<AllPostsTable {...propsWithPagination} />)

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2)
  })

  test('disables pagination buttons appropriately', () => {
    // Test first page
    const propsWithPagination = {
      ...defaultProps,
      totalPages: 3,
      totalCount: 25,
    }
    render(<AllPostsTable {...propsWithPagination} />)

    const prevButton = screen.getByText('Previous')
    const nextButton = screen.getByText('Next')

    // First page: Previous should be disabled, Next should be enabled
    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()

    cleanup()

    // Test middle page
    const propsOnPage2 = { ...propsWithPagination, currentPage: 2 }
    render(<AllPostsTable {...propsOnPage2} />)

    // Both buttons should be enabled on middle page
    const prevButtonPage2 = screen.getByText('Previous')
    const nextButtonPage2 = screen.getByText('Next')
    expect(prevButtonPage2).not.toBeDisabled()
    expect(nextButtonPage2).not.toBeDisabled()

    cleanup()

    // Test last page
    const propsOnPage3 = { ...propsWithPagination, currentPage: 3 }
    render(<AllPostsTable {...propsOnPage3} />)

    // Last page: Previous should be enabled, Next should be disabled
    const prevButtonPage3 = screen.getByText('Previous')
    const nextButtonPage3 = screen.getByText('Next')
    expect(prevButtonPage3).not.toBeDisabled()
    expect(nextButtonPage3).toBeDisabled()
  })

  test('does not show pagination when there is only one page', () => {
    render(<AllPostsTable {...defaultProps} />)

    expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  test('displays correct pagination info', () => {
    const propsWithPagination = {
      ...defaultProps,
      totalPages: 3,
      totalCount: 25,
    }
    render(<AllPostsTable {...propsWithPagination} />)

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })

  test('handles search with no results', () => {
    const propsWithSearch = {
      ...defaultProps,
      searchTerm: 'nonexistent',
      posts: [],
      totalCount: 0,
    }
    render(<AllPostsTable {...propsWithSearch} />)

    expect(
      screen.getByText('No days found matching your search criteria.')
    ).toBeInTheDocument()
    expect(screen.getByText('Clear Search')).toBeInTheDocument()
  })
})
