import React from 'react'
import { Link } from 'gatsby'

interface LayoutProps {
  location: {
    pathname: string
  }
  title: string
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ location, title, children }) => {
  const header: React.ReactElement = (
    <h1 className="text-2xl mb-6 mt-0">
      <Link className="" to={`/`}>
        {title}
      </Link>
    </h1>
  )

  return (
    <div className="mx-auto bg-black text-gray-200 transition-colors duration-200">
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
      <header className="pr-18 p-6 border-b border-gray-800">
        {header}
        <nav className="mt-4">
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`${location.pathname === '/' ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Home
            </Link>
            <Link
              to="/all"
              className={`${location.pathname === '/all' ? 'text-red-400 hover:text-red-300' : 'text-gray-400 hover:text-gray-300'}`}
            >
              All
            </Link>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      {/* <footer>{new Date().getFullYear()}</footer> */}
      {/* <RandomDayButton /> */}
    </div>
  )
}

export default Layout
