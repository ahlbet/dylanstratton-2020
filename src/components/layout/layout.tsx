import React from 'react'
import { Link } from 'gatsby'
import { LoaderIcon } from 'lucide-react'
import TatsSketch from '../tats-sketch/tats-sketch'

interface LayoutProps {
  location: {
    pathname: string
  }
  title: string
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ location, title, children }) => {
  const header: React.ReactElement = (
    <h1 className="text-2xl mt-0">
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
      {/* <header className="pr-18 p-6 border-b border-gray-800">{header}</header> */}
      <main className="h-screen w-screen flex items-center justify-center">
        {/* <LoaderIcon className="w-10 h-10 text-white animate-spin [animation-duration:2000ms]" /> */}
        <TatsSketch />
      </main>
      {/* <main>{children}</main> */}
      {/* <footer>{new Date().getFullYear()}</footer> */}
      {/* <RandomDayButton /> */}
    </div>
  )
}

export default Layout
