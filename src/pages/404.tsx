import React from 'react'
import { graphql, PageProps } from 'gatsby'

import Layout from '../components/layout/layout'
import SEO from '../components/seo/seo'

interface NotFoundPageData {
  site: {
    siteMetadata: {
      title: string
    }
  }
}

const NotFoundPage: React.FC<PageProps<NotFoundPageData>> = ({
  data,
  location,
}) => {
  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="404: Not Found" />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1>Day Not Found</h1>
      </div>
    </Layout>
  )
}

export default NotFoundPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
  }
`
