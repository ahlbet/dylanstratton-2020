/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import { graphql, useStaticQuery } from 'gatsby'

import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import React from 'react'
import { rhythm } from '../../utils/typography'

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/profile-pic.jpg/" }) {
        childImageSharp {
          gatsbyImageData(width: 50, height: 50, layout: FIXED)
        }
      }
      site {
        siteMetadata {
          author
        }
      }
    }
  `)

  const image = getImage(data.avatar)
  if (!image) {
    return null
  }

  const { author } = data.site.siteMetadata
  return (
    <div
      style={{
        display: `flex`,
        marginBottom: rhythm(2.5),
      }}
    >
      <GatsbyImage
        image={image}
        alt={author}
        style={{
          marginRight: rhythm(1 / 2),
          marginBottom: 0,
          width: 50,
          height: 50,
          borderRadius: `100%`,
        }}
      />
    </div>
  )
}

export default Bio
