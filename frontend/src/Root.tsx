import { Outlet } from "react-router-dom"
import Navbar from "./components/Navbar"

const Root = () => {
  return (
      <div className='w-full max-w-[105rem] mx-auto px-4 sm:px-6 lg:px-8'>
          <Navbar/>
          <Outlet/>
      </div>
  )
}

export default Root