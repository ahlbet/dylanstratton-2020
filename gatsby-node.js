const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

// Add cache headers for audio files
exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    module: {
      rules: [
        {
          test: /\.(wav|mp3|ogg|m4a)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'audio/[name].[hash].[ext]',
                publicPath: '/static/',
              },
            },
          ],
        },
      ],
    },
  })
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post/blog-post.js`)
  const result = await graphql(`
    {
      allMarkdownRemark(
        sort: { fields: [frontmatter___date], order: DESC }
        limit: 1000
      ) {
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

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const filePath = createFilePath({ node, getNode })

    // Only modify slug for blog posts that have the duplicate pattern
    let value = filePath
    const duplicateMatch = filePath.match(/\/([^/]+)\/\1\/$/)

    if (duplicateMatch) {
      // Extract just the directory name for blog posts (e.g., '/25jul01/25jul01/' -> '/25jul01/')
      const directoryName = duplicateMatch[1]
      value = `/${directoryName}/`
    }

    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
