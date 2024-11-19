import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DefaultLayout from './components/layouts/DefaultLayout';
import HomePage from './pages/home';


const router = createBrowserRouter([
  {
    path: '/',
    element: <DefaultLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />
      }
    ]
  }
])

function App() {
  return (
    <RouterProvider router={router} />
  )
}

export default App
