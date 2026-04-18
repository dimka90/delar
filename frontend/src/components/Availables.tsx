import icon from "../assets/icon.png"

const Availables = () => {
  return (
    <div>
        <div className="flex items-center justify-around mt-3">
        <div className="flex items-center gap-2 text-white">
          <img className="w-8 h-8 rounded-full" src={icon} alt="icon"/>
          <p className="text-xs">0XmghZR3UgYMCr...pC</p>
        </div>
        <p className="text-white">1.09 eth</p>
        <p className="text-white">Rayfield Jos</p>
        <p className='text-green-300'>+2.91%</p>
        </div>
    </div>
  )
}

export default Availables