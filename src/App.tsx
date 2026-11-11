import { ThemeProvider } from '@mui/material/styles'
import Box, { type BoxProps } from '@mui/material/Box'
import { RouterProvider } from 'react-router-dom'
import styled from 'styled-components'
import theme from './theme'
import router from './routes'

const AppContainer = styled(Box)<BoxProps>`
  display: flex;
`

const CurrentScreen = styled(Box)<BoxProps>`
  width: calc(100% - 240px);
  margin-left: 240px;
`

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AppContainer component="main">
        <CurrentScreen component="section">
          <RouterProvider router={router} />
        </CurrentScreen>
      </AppContainer>
    </ThemeProvider>
  )
}

export default App
