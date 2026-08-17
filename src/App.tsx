import './App.css'
import "./index.css";
import { RouterProvider } from 'react-router-dom'
import { router } from './Routes/RouteProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App