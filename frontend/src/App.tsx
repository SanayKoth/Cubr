import { Route, Routes } from 'react-router-dom'
import TimerPage from './routes/TimerPage'

/*
  App owns routing only. The root route "/" IS the timer and always will be —
  there is no landing/home page by design. Later versions add sibling routes
  (e.g. the Algorithm Library at 2.0); wiring the router now means that is an
  additive change, not a restructure.
*/
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TimerPage />} />
    </Routes>
  )
}
