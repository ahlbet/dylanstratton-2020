import React from 'react'
import { Link } from 'gatsby'
import { ThemeToggler } from 'gatsby-plugin-dark-mode'
import '../../utils/global.css'
import { rhythm, scale } from '../../utils/typography'
import RandomDayButton from '../random-day-button/random-day-button'

const Layout = ({ location, title, children }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  let header

  if (location.pathname === rootPath) {
    header = (
      <h1
        style={{
          ...scale(0.5),
          marginBottom: rhythm(1.5),
          marginTop: 0,
        }}
      >
        <Link
          style={{
            boxShadow: `none`,
            textDecoration: `none`,
            color: '#6082B6',
          }}
          to={`/`}
        >
          {title}
        </Link>
      </h1>
    )
  } else {
    header = (
      <h3
        style={{
          fontFamily: `Montserrat, sans-serif`,
          marginTop: 0,
        }}
      >
        <Link
          style={{
            boxShadow: `none`,
            textDecoration: `none`,
            color: `#A7C7E7`,
          }}
          to={`/`}
        >
          {title}
        </Link>
      </h3>
    )
  }
  return (
    <div
      style={{
        marginLeft: `auto`,
        marginRight: `auto`,
        // maxWidth: rhythm(56),
        padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        paddingBottom: `calc(${rhythm(1.5)} + 80px)` /* Account for fixed audio player */,
        // backgroundColor: 'var(--bg)',
        color: 'var(--textNormal)',
        transition: 'color 0.2s ease-out, background 0.2s ease-out',
      }}
    >
      {/* TODO: implement pretty toggle button 
      <ThemeToggler>
        {({ theme, toggleTheme }) => (
          <label>
            <input
              type="checkbox"
              onChange={e => toggleTheme(e.target.checked ? 'dark' : 'light')}
              checked={theme === 'dark'}
            />{' '}
            Dark mode
          </label>
        )}
      </ThemeToggler> */}
      <header style={{ paddingRight: '72px' }}>
        {header}
        <nav style={{ marginTop: rhythm(0.5) }}>
          <Link
            to="/all"
            style={{
              color: '#DE3163',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            All
          </Link>
        </nav>
      </header>
      <main style={{ marginTop: '25px' }}>{children}</main>
      <footer>{new Date().getFullYear()}</footer>
      {/* <RandomDayButton /> */}
    </div>
  )
}

export default Layout
