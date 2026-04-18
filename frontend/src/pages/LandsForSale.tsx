import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Landmark, MapPin, Search } from "lucide-react";
import { toast } from "react-toastify";
import useContract from "../hooks/useContract";
import LandCard from "../components/cards/LandCard.tsx";
import Loader from "../components/Loader.tsx";
import DashboardLayout from "../components/layouts/DashboardLayout.tsx";
import { formatEther } from "ethers";

export type Land = {
  numberOfPlots: number,
  titleNumber: number,
  state: string,
  lga: string,
  city: string,
  assessedValuePerPlot: string,
  listingPricePerPlot?: string | null,
  isVerified: boolean,
  isListed: boolean,
  imageCID: string,
  coFoCID: string,
  landOwner: string;
  landIndex: number;
  listingId?: number | null;
  activeListingId?: number;
}

const LandsForSale = () => {
  const readOnlyDelarContract = useContract();
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAlllands = useCallback(async () => {
    if (!readOnlyDelarContract) return;

    setIsLoading(true);

    try {
      const rawListings = await readOnlyDelarContract.viewAllListings();
      console.log("Raw Listings:", rawListings);
      const landObjects = await Promise.all(
        rawListings.map(async (listing: { listingId: bigint; owner: string; landIndex: bigint; listingPricePerPlot: bigint }) => {
          const owner = listing.owner;
          const index = Number(listing.landIndex);
          const landDetails = await readOnlyDelarContract.getLandDetails(
            owner,
            index
          );

          if (Number(landDetails.numberOfPlots) === 0) {
            return null;
          }

          return {
            numberOfPlots: Number(landDetails.numberOfPlots),
            titleNumber: Number(landDetails.titleNumber),
            state: landDetails.state,
            lga: landDetails.lga,
            city: landDetails.city,
            assessedValuePerPlot: formatEther(landDetails.assessedValuePerPlot),
            listingPricePerPlot: formatEther(listing.listingPricePerPlot),
            isVerified: landDetails.isVerified,
            isListed: landDetails.isListed,
            imageCID: landDetails.imageCID,
            coFoCID: landDetails.coFoCID,
            landOwner: owner,
            landIndex: index,
            listingId: Number(listing.listingId),
            activeListingId: Number(landDetails.activeListingId),
          };
        })
      );

      const filteredLands = landObjects.filter((land): land is Land => land !== null && land.numberOfPlots > 0);
      setLands(filteredLands);

      // setLands(landObjects);
      console.log("Owner Lands:", landObjects);
    } catch (error) {
      console.error("Error fetching all lands:", error);
      toast.error("Failed to fetch land, please try again later");
    } finally {
      setIsLoading(false);
    }
  }, [readOnlyDelarContract]);

  useEffect(() => {
    fetchAlllands();
  }, [fetchAlllands]);

  const filteredLands = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return lands;
    }

    return lands.filter((land) =>
      [
        land.city,
        land.lga,
        land.state,
        `fg-${land.titleNumber}`,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [lands, searchTerm]);

  const listedPlots = lands.reduce((total, land) => total + land.numberOfPlots, 0);
  const verifiedListings = lands.filter((land) => land.isVerified).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(180,140,90,0.14)] bg-[#202a3d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Landmark className="h-4 w-4" />
            Properties For Sale
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <InsightCard icon={<Landmark className="h-5 w-5" />} label="Active Listings" value={`${lands.length}`} />
            <InsightCard icon={<MapPin className="h-5 w-5" />} label="Plots Available" value={`${listedPlots}`} />
            <InsightCard icon={<BadgeCheck className="h-5 w-5" />} label="Verified Listings" value={`${verifiedListings}`} />
          </div>
        </section>

        <section className="mt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Property Marketplace</p>
          </div>

          <div className="relative mt-4 w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgba(255,255,255,0.36)]" />
            <input
              type="text"
              name="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search title number, city, LGA, or state"
              className="w-full rounded-[1rem] border border-[rgba(180,140,90,0.14)] bg-[#202a3d] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-[rgba(255,255,255,0.36)] focus:border-primary focus:bg-[#263149]"
            />
          </div>
        </section>

        <section className="mt-6">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-[1.5rem] border border-[rgba(180,140,90,0.12)] bg-[#141d2e]">
              <Loader />
            </div>
          ) : filteredLands.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[rgba(180,140,90,0.18)] bg-[#141d2e] px-6 py-12 text-center">
              <h3 className="text-xl font-semibold text-white">
                {lands.length === 0 ? "No properties are listed for sale yet." : "No properties match your search."}
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[rgba(255,255,255,0.68)]">
                {lands.length === 0
                  ? "Properties will appear here once owners list them for sale on DELAR."
                  : "Try another title number or location to find a property."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredLands.map((land) => (
                <LandCard key={`${land.landOwner}-${land.landIndex}-${land.listingId ?? "record"}`} {...land} />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

interface InsightCardProps {
  icon: JSX.Element;
  label: string;
  value: string;
}

const InsightCard = ({ icon, label, value }: InsightCardProps) => (
  <div className="rounded-[1.1rem] border border-[rgba(180,140,90,0.14)] bg-[#202a3d] p-4 shadow-sm">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#283247] text-primary">
      {icon}
    </div>
    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,255,255,0.52)]">{label}</p>
    <p className="mt-2 text-[2rem] font-semibold leading-none text-white">{value}</p>
  </div>
);

export default LandsForSale;
