import React from 'react'
import { Link, useStaticQuery, graphql } from 'gatsby'
import { Shuffle } from 'lucide-react'

const RandomDayButton = () => {
  const data = useStaticQuery(graphql`
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

  const posts = data.allMarkdownRemark.edges

  const getRandomPost = () => {
    const randomIndex = Math.floor(Math.random() * posts.length)
    return posts[randomIndex].node
  }

  const randomPost = getRandomPost()

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
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#c02a56'
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#DE3163'
      }}
      className="random-day-button"
    >
      <Shuffle size={16} />
    </Link>
  )
}

export default RandomDayButton
