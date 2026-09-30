import { Outlet } from 'react-router'
import { Layout } from 'antd'
import LayoutMenu from './components/LayoutMenu'
import ThemeProvider from './components/providers/ThemeProvider'

const { Header, Content } = Layout

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <Layout>
        <Header style={{ padding: 0 }}>
          <LayoutMenu />
        </Header>
        <Content style={{ flex: 1 }}>
          <Outlet />
        </Content>
      </Layout>
    </ThemeProvider>
  )
}

export default App
