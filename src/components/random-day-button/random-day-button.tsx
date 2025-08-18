import React from 'react'
import { Link, useStaticQuery, graphql } from 'gatsby'
import { Shuffle } from 'lucide-react'

interface MarkdownPost {
  node: {
    fields: {
      slug: string
    }
    frontmatter: {
      title: string
    }
  }
}

interface RandomDayButtonQueryData {
  allMarkdownRemark: {
    edges: MarkdownPost[]
  }
}

const RandomDayButton: React.FC = () => {
  const data: RandomDayButtonQueryData = useStaticQuery(graphql`
    query {
      allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              title
            }
          }
        }
      }
    }
  `)

  const posts = data?.allMarkdownRemark?.edges

  // If no posts are available, don't render the button
  if (!posts || posts.length === 0) {
    return null
  }

  const getRandomPost = (): MarkdownPost['node'] => {
    const randomIndex = Math.floor(Math.random() * posts.length)
    return posts[randomIndex].node
  }

  const randomPost = getRandomPost()

  // Additional safety check
  if (!randomPost?.fields?.slug) {
    return null
  }

  return (
    <Link
      to={randomPost.fields.slug}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '16px',
        backgroundColor: '#DE3163',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'background-color 0.2s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
        ;(e.target as HTMLAnchorElement).style.backgroundColor = '#c02a56'
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
        ;(e.target as HTMLAnchorElement).style.backgroundColor = '#DE3163'
      }}
      className="random-day-button"
    >
      <Shuffle size={16} />
    </Link>
  )
}

export default RandomDayButton
