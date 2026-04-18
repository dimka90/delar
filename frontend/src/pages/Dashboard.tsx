import { useCallback, useEffect, useState } from "react";
import useContract from "../hooks/useContract";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BadgeCheck,
  Clock3,
  Landmark,
  MapPinHouse,
  Plus,
} from "lucide-react";
import image from "../assets/land3.png";
import DashboardLayout from "../components/layouts/DashboardLayout.tsx";
import Loader from "../components/Loader.tsx";
import { Land } from "./LandsForSale.tsx";
import { EventLog, formatEther } from "ethers";

interface RawLandData {
  [index: number]: string | number | boolean | bigint;
  length: number;
}

interface ActivityEntry {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

const isEventLog = (log: unknown): log is EventLog => {
  return typeof log === "object" && log !== null && "args" in log;
};

const ACTIVITY_LOOKBACK_BLOCKS = 50_000;
const LOG_QUERY_CHUNK_SIZE = 9_000;

const Dashboard = () => {
  const activityDelarContract = useContract();
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(false);
  const { address } = useAppKitAccount();
  const navigate = useNavigate();

  const fetchOwnerlands = useCallback(async () => {
    if (!activityDelarContract || !address) return;

    setIsLoading(true);

    try {
      const ownerLands: RawLandData[] = await activityDelarContract.veiwOwnerLands({
        from: address,
      });
      const ownerLandsWithIndex: Land[] = await Promise.all(ownerLands.map(async (land, index) => {
        const activeListingId = Number(land[10]);
        const listing =
          activeListingId > 0 ? await activityDelarContract.listings(activeListingId) : null;

        return {
          numberOfPlots: Number(land[0]),
          titleNumber: Number(land[1]),
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
      toast.error("Failed to fetch lands, please try again later");
    } finally {
      setIsLoading(false);
    }
  }, [activityDelarContract, address]);

  const fetchRecentActivity = useCallback(async () => {
    if (!activityDelarContract || !address) return;

    setIsActivityLoading(true);

    try {
      const provider = activityDelarContract.runner?.provider;
      if (!provider) return;

      const latestBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latestBlock - ACTIVITY_LOOKBACK_BLOCKS);
      const ownerAddress = address.toLowerCase();

      const fetchLogsInChunks = async (filter: ReturnType<typeof activityDelarContract.filters.LandRegistered>) => {
        const logs = [];

        for (let startBlock = fromBlock; startBlock <= latestBlock; startBlock += LOG_QUERY_CHUNK_SIZE) {
          const endBlock = Math.min(startBlock + LOG_QUERY_CHUNK_SIZE - 1, latestBlock);
          const chunkLogs = await activityDelarContract.queryFilter(filter, startBlock, endBlock);
          logs.push(...chunkLogs);
        }

        return logs;
      };

      const [
        registeredLogs,
        verifiedLogs,
        listedLogs,
        delistedLogs,
        soldLogs,
      ] = await Promise.all([
        fetchLogsInChunks(activityDelarContract.filters.LandRegistered()),
        fetchLogsInChunks(activityDelarContract.filters.LandVerified(address)),
        fetchLogsInChunks(activityDelarContract.filters.LandListedForSale()),
        fetchLogsInChunks(activityDelarContract.filters.LandDelistedForSale()),
        fetchLogsInChunks(activityDelarContract.filters.LandSold()),
      ]);

      const eventRegisteredLogs = registeredLogs.filter(isEventLog);
      const eventVerifiedLogs = verifiedLogs.filter(isEventLog);
      const eventListedLogs = listedLogs.filter(isEventLog);
      const eventDelistedLogs = delistedLogs.filter(isEventLog);
      const eventSoldLogs = soldLogs.filter(isEventLog);

      const blockTimestampCache = new Map<number, number>();
      const getTimestamp = async (blockNumber: number) => {
        if (blockTimestampCache.has(blockNumber)) {
          return blockTimestampCache.get(blockNumber) as number;
        }

        const block = await provider.getBlock(blockNumber);
        const timestamp = block?.timestamp ?? 0;
        blockTimestampCache.set(blockNumber, timestamp);
        return timestamp;
      };

      const activityEntries = await Promise.all([
        ...eventRegisteredLogs
          .filter((log) => String(log.args._landOwner).toLowerCase() === ownerAddress)
          .map(async (log) => ({
            id: `${log.transactionHash}-${log.index}`,
            title: "Land registered",
            description: `${log.args._city}, ${log.args._lga}`,
            timestamp: await getTimestamp(log.blockNumber),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          })),
        ...eventVerifiedLogs.map(async (log) => ({
          id: `${log.transactionHash}-${log.index}`,
          title: "Land verified",
          description: `Record #${Number(log.args._landIndex) + 1} is now verified`,
          timestamp: await getTimestamp(log.blockNumber),
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
        })),
        ...eventListedLogs
          .filter((log) => String(log.args._landOwner).toLowerCase() === ownerAddress)
          .map(async (log) => ({
            id: `${log.transactionHash}-${log.index}`,
            title: "Land listed for transfer",
            description: `Listing #${Number(log.args._listingId)} at ${formatEther(log.args._pricePerPlot)} USDT per plot`,
            timestamp: await getTimestamp(log.blockNumber),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          })),
        ...eventDelistedLogs
          .filter((log) => String(log.args._landOwner).toLowerCase() === ownerAddress)
          .map(async (log) => ({
            id: `${log.transactionHash}-${log.index}`,
            title: "Listing cancelled",
            description: `Listing #${Number(log.args._listingId)} was removed from the marketplace`,
            timestamp: await getTimestamp(log.blockNumber),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          })),
        ...eventSoldLogs
          .filter((log) => String(log.args._previousOwner).toLowerCase() === ownerAddress)
          .map(async (log) => ({
            id: `${log.transactionHash}-${log.index}-sold-from`,
            title: "Land sold",
            description: `${formatEther(log.args._amount)} USDT received from sale`,
            timestamp: await getTimestamp(log.blockNumber),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          })),
        ...eventSoldLogs
          .filter((log) => String(log.args._newOwner).toLowerCase() === ownerAddress)
          .map(async (log) => ({
            id: `${log.transactionHash}-${log.index}-sold-to`,
            title: "Land purchased",
            description: `${formatEther(log.args._amount)} USDT spent to acquire a record`,
            timestamp: await getTimestamp(log.blockNumber),
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
          })),
      ]);

      const dedupedActivity = Array.from(
        new Map(activityEntries.map((entry) => [entry.id, entry])).values()
      )
        .sort((a, b) => {
          if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber;
          return b.timestamp - a.timestamp;
        })
        .slice(0, 6);

      setActivity(dedupedActivity);
    } catch (error) {
      console.error("Error fetching onchain activity:", error);
      toast.error("Failed to fetch recent activity");
    } finally {
      setIsActivityLoading(false);
    }
  }, [activityDelarContract, address]);

  useEffect(() => {
    fetchOwnerlands();
  }, [fetchOwnerlands]);

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  const totalPlots = lands.reduce((acc, land) => acc + Number(land.numberOfPlots), 0);
  const verifiedLands = lands.filter((land) => land.isVerified).length;
  const pendingVerification = lands.filter((land) => !land.isVerified).length;

  return (
    <>
      <DashboardLayout>
        <section className="mb-8 rounded-[1.25rem] border border-[rgba(180,140,90,0.12)] bg-[#141d2e] p-7 shadow-lg lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Registry Overview</p>
              <p className="mt-2 text-sm leading-6 text-[rgba(255,255,255,0.65)]">
                Track your land properties, monitor verification status, and manage listings from one place.
              </p>
            </div>

            <button
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-gray-950 transition hover:brightness-110"
              onClick={() => navigate("/register")}
            >
              <Plus className="h-4 w-4" />
              Register New Land
            </button>
          </div>
        </section>

        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6 xl:grid-cols-4">
          <StatCard
            title="Registered Properties"
            value={lands.length.toString()}
            description="Land properties linked to your address"
            icon={<MapPinHouse className="h-5 w-5" />}
          />
          <StatCard
            title="Total Plots"
            value={totalPlots.toString()}
            description="Combined plot count across properties"
            icon={<Landmark className="h-5 w-5" />}
          />
          <StatCard
            title="Verified Properties"
            value={verifiedLands.toString()}
            description="Already marked verified onchain"
            icon={<BadgeCheck className="h-5 w-5" />}
          />
          <StatCard
            title="Pending Verification"
            value={pendingVerification.toString()}
            description="Properties awaiting verification"
            icon={<Clock3 className="h-5 w-5" />}
          />
        </div>

        <div className="mb-8">
          <section className="rounded-[1.25rem] border border-[rgba(180,140,90,0.12)] bg-[#141d2e] shadow-lg">
            <div className="border-b border-[rgba(180,140,90,0.08)] px-7 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Onchain History</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Recent Activity</h2>
            </div>

            <div className="p-7">
              {isActivityLoading ? (
                <div className="flex min-h-56 items-center justify-center">
                  <Loader />
                </div>
              ) : activity.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-[1rem] border border-dashed border-[rgba(180,140,90,0.12)] bg-[#192235] px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">No activity yet</h3>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[rgba(255,255,255,0.65)]">
                    Your onchain transactions, registrations, verifications, and transfers will appear here as they happen.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activity.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-[1rem] border border-[rgba(180,140,90,0.1)] bg-[#192235] px-5 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">{entry.title}</p>
                          <p className="mt-1 text-sm text-[rgba(255,255,255,0.65)]">{entry.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-xs text-[rgba(255,255,255,0.55)] sm:justify-end">
                          <span>{formatActivityTime(entry.timestamp)}</span>
                          <span>Tx: {shortenHash(entry.transactionHash)}</span>
                          <a
                            href={`https://sepolia.basescan.org/tx/${entry.transactionHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary transition hover:text-[#f1c27a]"
                          >
                            View on Basescan
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="rounded-[1.25rem] border border-[rgba(180,140,90,0.12)] bg-[#141d2e] p-7 shadow-lg md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Property Register</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Registered land properties</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(255,255,255,0.65)]">
                Review title references, locations, current assessed value, and whether each parcel is available for transfer.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="mt-6 w-full text-sm">
              <thead className="bg-[#111827]/88 text-left text-[rgba(255,255,255,0.62)]">
                <tr>
                  <th className="p-3"></th>
                  <th className="p-3">No of Plots</th>
                  <th className="p-3">Title Number</th>
                  <th className="p-3">State</th>
                  <th className="p-3">LGA</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Assessed Value</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {
                  isLoading ?
                    (
                      <tr className="mx-auto">
                        <td colSpan={9} className="py-8">
                          <Loader />
                        </td>
                      </tr>
                    )
                    :
                    lands && lands.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-8 text-center text-[rgba(255,255,255,0.65)]"
                        >
                          No properties registered yet
                        </td>
                      </tr>
                    ) : (
                      lands.map((land, index) => (
                        <tr key={index} className="border-b border-white/6 text-[rgba(255,255,255,0.72)]">
                          <td className="p-3">
                            <img src={land.imageCID ? `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${land.imageCID}` : image} className="w-8 h-8 rounded-full" />
                          </td>
                          <td className="p-3">{land.numberOfPlots}</td>
                          <td className="p-3">FG-{land.titleNumber}</td>
                          <td className="p-3">{land.state}</td>
                          <td className="p-3">{land.lga}</td>
                          <td className="p-3">{land.city}</td>
                          <td className="p-3">
                            {land.assessedValuePerPlot} USDT
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${land.isListed ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-700"
                              }`}>
                              {land.isListed ? "Listed" : "Registry Only"}
                            </span>
                          </td>

                          <td className="p-3">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${land.isVerified
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                                }`}
                            >
                              {land.isVerified ? "Verified" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};


interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: JSX.Element;
}

const StatCard = ({ title, value, description, icon }: StatCardProps) => {
  return (
    <div className="rounded-[1.1rem] border border-[rgba(180,140,90,0.12)] bg-[#141d2e] p-7 shadow-lg">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#201f2b] text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[rgba(255,255,255,0.52)]">{title}</h3>
      <p className="mt-2 text-4xl font-semibold leading-none text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[rgba(255,255,255,0.65)]">{description}</p>
    </div>
  );
};

const formatActivityTime = (timestamp: number) => {
  if (!timestamp) {
    return "Just now";
  }

  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const shortenHash = (hash: string) => {
  if (!hash) return "";
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

export default Dashboard;
