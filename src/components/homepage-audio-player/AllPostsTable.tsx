import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'

import {
  ChevronLeft,
  ChevronRight,
  Search,
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
  searchTerm: string
  onSearchChange: (value: string) => void
  sortDirection: 'asc' | 'desc'
  onSortChange: () => void
  currentPage: number
  onPageChange: (page: number) => void
  totalPages: number
  totalCount: number
  postsPerPage: number
  searchLoading?: boolean
}

export const AllPostsTable: React.FC<AllPostsTableProps> = ({
  posts,
  currentBlogPost,
  onPostClick,
  searchTerm,
  onSearchChange,
  sortDirection,
  onSortChange,
  currentPage,
  onPageChange,
  totalPages,
  totalCount,
  postsPerPage,
  searchLoading = false,
}) => {
  const startIndex = (currentPage - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage

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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="animate-spin h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSortChange}
            className="px-3"
            aria-label="Toggle sort direction"
          >
            {getSortIcon()}
          </Button>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-400">
        Showing {startIndex + 1}-{Math.min(endIndex, posts.length)} of{' '}
        {totalCount} days
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Posts Table */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card
            key={post.id}
            className={`bg-black border transition-colors cursor-pointer ${
              isCurrentBlogPost(post)
                ? 'border-red-400 bg-black-900'
                : 'border-gray-800 hover:border-gray-700'
            }`}
            onClick={() => onPostClick(post)}
          >
            <div className="p-6">
              <div className="flex items-baseline space-x-4 mb-3 group">
                <h3 className="text-red-400 font-medium">{post.title}</h3>
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
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* No Results */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            No days found matching your search criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              onSearchChange('')
              onPageChange(1)
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
