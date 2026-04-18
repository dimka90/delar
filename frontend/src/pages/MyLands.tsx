import { useCallback, useEffect, useState } from "react";
import useContract from "../hooks/useContract";
import { toast } from "react-toastify";
import { useAppKitAccount } from "@reown/appkit/react";
import DashboardLayout from "../components/layouts/DashboardLayout.tsx";
import LandCard from "../components/cards/LandCard.tsx";
import Loader from "../components/Loader.tsx";
import { Land } from "./LandsForSale.tsx";
import { formatEther } from "ethers";

type RawLand = {
  [index: number]: string | number | boolean | bigint;
};

const MyLands = () => {
  const readOnlyDelarContract = useContract();
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { address } = useAppKitAccount();

  const fetchOwnerlands = useCallback(async () => {
    if (!readOnlyDelarContract || !address) return;

    setIsLoading(true);

    try {
      const ownerLands: RawLand[] = await readOnlyDelarContract.veiwOwnerLands({
        from: address,
      });
      const ownerLandsWithIndex: Land[] = await Promise.all(ownerLands.map(async (land, index) => {
        const activeListingId = Number(land[10] ?? 0);
        const listing =
          activeListingId > 0 ? await readOnlyDelarContract.listings(activeListingId) : null;

        return {
          numberOfPlots: Number(land[0].toString()),
          titleNumber: Number(land[1].toString()),
          state: String(land[2]),
          lga: String(land[3]),
          city: String(land[4]),
          assessedValuePerPlot: formatEther(land[5].toString()),
          listingPricePerPlot: listing ? formatEther(listing.listingPricePerPlot) : null,
          isVerified: Boolean(land[6]),
          isListed: Boolean(land[7]),
          imageCID: String(land[8]),
          coFoCID: String(land[9]),
          landOwner: address ?? "",
          landIndex: index,
          listingId: activeListingId || null,
          activeListingId,
        };
      }));

      const filteredLands = ownerLandsWithIndex.filter(ownerLand => ownerLand.numberOfPlots > 0);
      setLands(filteredLands);

    } catch (error) {
      console.error("Error fetching owner lands:", error);
      toast.error("Failed to fetch land, please try again later");
    } finally {
      setIsLoading(false);
    }
  }, [address, readOnlyDelarContract]);

  useEffect(() => {
    fetchOwnerlands();
  }, [fetchOwnerlands]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <div>
          {isLoading
            ? (
              <div>
                <Loader />
              </div>
            )
            : lands && lands.length === 0 ? (
              <p className="text-gray-500 col-span-3 text-center py-10">
                No properties found for your address
              </p>
            )
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lands.length > 0 && lands.map((land, index) => (
                    <div >
                      <LandCard key={index} {...land} />
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyLands;
