import { Route, Routes } from 'react-router-dom'
import LibraryPage from './algs/LibraryPage'
import SettingsPage from './settings/SettingsPage'
import TimerPage from './routes/TimerPage'

/*
  App owns routing only. The root route "/" IS the timer and always will be —
  there is no landing/home page by design. Settings is nested so TimerPage
  stays mounted. /algs is a sibling and unmounts the timer on purpose.
*/
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TimerPage />}>
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/algs/:set?" element={<LibraryPage />} />
    </Routes>
  )
}
