import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"

function App({ userId }) {
  return (
    <>
      <Pages userId={userId} />
      <Toaster />
    </>
  )
}

export default App 