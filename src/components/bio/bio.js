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
    <div className="flex mb-10">
      <GatsbyImage
        image={image}
        alt={author}
        className="mr-2 mb-0 w-12 h-12 rounded-full"
      />
    </div>
  )
}

export default Bio
