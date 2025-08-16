import React, { useState, useMemo } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'

import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react'
import { Link } from 'gatsby'

interface BlogPost {
  id: string
  title: string
  date: string
  content: string
  daily_id?: string
}

interface AllPostsTableProps {
  posts: BlogPost[]
  currentBlogPost: string | null
  onPostClick: (post: BlogPost) => void
}

type SortDirection = 'asc' | 'desc'

export const AllPostsTable: React.FC<AllPostsTableProps> = ({
  posts,
  currentBlogPost,
  onPostClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(10)

  // Filter and sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.date.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Sort posts by date
    filtered.sort((a, b) => {
      const aValue = new Date(a.date).getTime()
      const bValue = new Date(b.date).getTime()

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [posts, searchTerm, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const currentPosts = filteredAndSortedPosts.slice(startIndex, endIndex)

  const handleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const isCurrentBlogPost = (post: BlogPost) => {
    return post.daily_id === currentBlogPost
  }

  const getSortIcon = () => {
    return sortDirection === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search days by title, content, or date..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSort}
            className="px-3"
            aria-label="Toggle sort direction"
          >
            {getSortIcon()}
          </Button>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-400">
        Showing {startIndex + 1}-
        {Math.min(endIndex, filteredAndSortedPosts.length)} of{' '}
        {filteredAndSortedPosts.length} days
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Posts Table */}
      <div className="space-y-4">
        {currentPosts.map((post) => (
          <Card
            key={post.id}
            className={`bg-black border transition-colors cursor-pointer ${
              isCurrentBlogPost(post)
                ? 'border-red-400 bg-gray-900'
                : 'border-gray-800 hover:border-gray-700'
            }`}
            onClick={() => onPostClick(post)}
          >
            <div className="p-6">
              <div className="flex items-baseline space-x-4 mb-3 group">
                <h3 className="text-red-400 font-medium group-hover:text-red-300 transition-colors duration-200">
                  <Link to={post.id} className="">
                    {post.title}
                  </Link>
                </h3>
                <span className="text-xs text-gray-500">{post.date}</span>
              </div>
              <p className="text-gray-300 leading-relaxed">{post.content}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredAndSortedPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            No days found matching your search criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('')
              setCurrentPage(1)
            }}
            className="mt-4"
          >
            Clear Search
          </Button>
        </div>
      )}
    </div>
  )
}
