import { Outlet } from 'react-router'
import { HomeMenu } from './components/home/HomeMenu'
import { ThemeProvider } from './components/providers/ThemeProvider'

function App(): React.JSX.Element {
  const toggleDarkMode = async (): Promise<void> => {
    await window.darkMode.toggle()
  }

  return (
    <ThemeProvider>
      <HomeMenu />
      <button id="toggle-dark-mode" onClick={toggleDarkMode}>
        Toggle Dark Mode
      </button>
      <button id="reset-to-system">Reset to System Theme</button>
      <Outlet />
    </ThemeProvider>
  )
}

export default App
