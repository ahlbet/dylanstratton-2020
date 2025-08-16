import React from 'react'
import { Link, graphql, PageProps } from 'gatsby'

import Bio from '../components/bio/bio'
import Layout from '../components/layout/layout'
import SEO from '../components/seo/seo'
import { rhythm } from '../utils/typography'
import Calendar from '../components/calendar/calendar'
import AudioReactiveGridSketch from '../components/audio-reactive-grid-sketch/audio-reactive-grid-sketch'
import GridSketch from '../components/grid-sketch/grid-sketch'

// Types
interface BlogPost {
  node: {
    excerpt: string
    fields: {
      slug: string
    }
    frontmatter: {
      date: string
      title: string
      description?: string
    }
  }
}

interface IndexPageData {
  site: {
    siteMetadata: {
      title: string
    }
  }
  allMarkdownRemark: {
    edges: BlogPost[]
  }
}

const markovText = 'Hello, world!'

const BlogIndex: React.FC<PageProps<IndexPageData>> = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMarkdownRemark.edges

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="All posts" />
      <Bio />
      <Calendar />
      {posts.map(({ node }) => {
        const title = node.frontmatter.title || node.fields.slug
        return (
          <article key={node.fields.slug}>
            <header>
              <h3
                style={{
                  marginBottom: rhythm(1 / 4),
                }}
              >
                <Link style={{ boxShadow: `none` }} to={node.fields.slug}>
                  {title}
                </Link>
              </h3>
              <small>{node.frontmatter.date}</small>
            </header>
            <section>
              <p
                dangerouslySetInnerHTML={{
                  __html: node.frontmatter.description || node.excerpt,
                }}
              />
            </section>
          </article>
        )
      })}
      <GridSketch
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: -1,
        }}
      />
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          excerpt
          fields {
            slug
          }
          frontmatter {
            date(formatString: "MMMM DD, YYYY")
            title
          }
        }
      }
    }
  }
`
