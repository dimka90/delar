import icon from "../assets/location.svg";

interface LandDetailsProps {
  numberOfPlots: number;
  titleNumber: string;
  state: string;
  lga: string;
  city: string;
  pricePerPlot: number;
  isVerified: boolean;
  forSale: boolean;
}

const LandDetails: React.FC<LandDetailsProps> = ({
  numberOfPlots,
  titleNumber,
  state,
  lga,
  city,
  pricePerPlot,
  isVerified,
  forSale

}) => {
  return (
    <div className="rounded-lg flex flex-col h-full px-2 mt-2">
      <div className="flex items-center text-black">
        <img className="w-6 h-6 rounded-full" src={icon} alt="icon" />
        <p className="text-xs md:text-sm truncate ml-3">{state}</p>
      </div>

      <p className="text-black text-xs md:text-sm">
        Available Plots: {numberOfPlots}
      </p>
      <p className="text-black text-xs md:text-sm mt-1 font-bold">
        Title No: {titleNumber}
      </p>

      <p className="text-black text-xs md:text-sm">
        L.G.A: {lga}
      </p>

      <p className="text-black text-xs md:text-sm">
        City: {city}
      </p>

      <p className="text-black text-xs md:text-sm">
        PricePerPlot: {pricePerPlot}
      </p>
      <p className="text-black text-xs md:text-sm mt-1 font-bold">
        isVerified: {isVerified}
      </p>
     
      <p className="text-black text-xs md:text-sm mt-1 font-bold">
        forSale: {forSale}
      </p>
    </div>
  );
};

export default LandDetails;
