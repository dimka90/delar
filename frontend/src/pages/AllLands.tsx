import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, GalleryVerticalEnd, MapPin, Search, ShieldCheck } from "lucide-react";
import useContract from "../hooks/useContract";
import { toast } from "react-toastify";
import DashboardLayout from "../components/layouts/DashboardLayout.tsx";
import LandCard from "../components/cards/LandCard.tsx";
import Loader from "../components/Loader.tsx";
import { Land } from "./LandsForSale.tsx";
import { formatEther } from "ethers";

const AllLands = () => {
  const readOnlyDelarContract = useContract();
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAlllands = useCallback(async () => {
    if (!readOnlyDelarContract) return;

    setIsLoading(true);

    try {
      const rawRegisteredLands = await readOnlyDelarContract.viewAllRegisteredLands();
      const landObjects = await Promise.all(
        rawRegisteredLands.map(async (registeredLand: { owner: string; landIndex: bigint; titleNumber: bigint }) => {
          const owner = registeredLand.owner;
          const index = Number(registeredLand.landIndex);
          const landDetails = await readOnlyDelarContract.getLandDetails(owner, index);

          if (Number(landDetails.numberOfPlots) === 0) {
            return null;
          }

          let listingPricePerPlot: string | null = null;
          let listingId: number | null = null;

          if (landDetails.isListed && Number(landDetails.activeListingId) > 0) {
            const listing = await readOnlyDelarContract.listings(Number(landDetails.activeListingId));

            if (listing.active) {
              listingPricePerPlot = formatEther(listing.listingPricePerPlot);
              listingId = Number(listing.listingId);
            }
          }

          return {
            numberOfPlots: Number(landDetails.numberOfPlots),
            titleNumber: Number(landDetails.titleNumber),
            state: landDetails.state,
            lga: landDetails.lga,
            city: landDetails.city,
            assessedValuePerPlot: formatEther(landDetails.assessedValuePerPlot),
            listingPricePerPlot,
            isVerified: landDetails.isVerified,
            isListed: landDetails.isListed,
            imageCID: landDetails.imageCID,
            coFoCID: landDetails.coFoCID,
            landOwner: owner,
            landIndex: index,
            listingId,
            activeListingId: Number(landDetails.activeListingId),
          };
        })
      );

      setLands(landObjects.filter((land): land is Land => land !== null && land.numberOfPlots > 0));
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
      [land.city, land.lga, land.state, `fg-${land.titleNumber}`]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [lands, searchTerm]);

  const listedPlots = lands.reduce((total, land) => total + land.numberOfPlots, 0);
  const verifiedCount = lands.filter((land) => land.isVerified).length;
  const listedCount = lands.filter((land) => land.isListed).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(180,140,90,0.14)] bg-[#202a3d] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <GalleryVerticalEnd className="h-4 w-4" />
            All Registered Properties
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total Properties" value={`${lands.length}`} icon={<GalleryVerticalEnd className="h-5 w-5" />} />
            <SummaryCard label="Verified Properties" value={`${verifiedCount}`} icon={<BadgeCheck className="h-5 w-5" />} />
            <SummaryCard label="Properties For Sale" value={`${listedCount}`} icon={<ShieldCheck className="h-5 w-5" />} />
            <SummaryCard label="Plots Represented" value={`${listedPlots}`} icon={<MapPin className="h-5 w-5" />} />
          </div>
        </section>

        <section className="mt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Property Directory</p>
          </div>
          <div className="relative mt-4 w-full">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[rgba(255,255,255,0.36)]" />
            <input
              type="text"
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
                {lands.length === 0 ? "No properties have been registered yet." : "No properties match your search."}
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[rgba(255,255,255,0.68)]">
                {lands.length === 0
                  ? "Registered land properties will appear here once users begin creating them on DELAR."
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

interface SummaryCardProps {
  label: string;
  value: string;
  icon: JSX.Element;
}

const SummaryCard = ({ label, value, icon }: SummaryCardProps) => (
  <div className="rounded-[1.1rem] border border-[rgba(180,140,90,0.14)] bg-[#202a3d] p-4 shadow-sm">
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#283247] text-primary">
      {icon}
    </div>
    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[rgba(255,255,255,0.52)]">{label}</p>
    <p className="mt-2 text-[2rem] font-semibold leading-none text-white">{value}</p>
  </div>
);

export default AllLands;
