import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import { FileText, MapPin, ArrowLeft } from "lucide-react";
import { formatEther } from "ethers";
import { toast } from "react-toastify";
import Loader from "../components/Loader.tsx";
import FullModal from "../components/modals/FullModal.tsx";
import ListLandButton from "../components/ListLandButton.tsx";
import useContract from "../hooks/useContract";
import useBuyLand from "../hooks/useBuyLand";
import useVerifyLand from "../hooks/useVerifyLand";
import image from "../assets/land3.png";
import type { Land } from "./LandsForSale.tsx";

interface HistoryRecord {
  soldFrom: string;
  soldTo: string;
  amount: bigint;
  numberOfPlots: bigint;
  date: bigint;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const RecordDetails = () => {
  const { owner = "", landIndex = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { address } = useAppKitAccount();
  const readOnlyContract = useContract();
  const buyLand = useBuyLand();
  const verifyLand = useVerifyLand();

  const [land, setLand] = useState<Land | null>((location.state as { land?: Land } | null)?.land ?? null);
  const [contractOwner, setContractOwner] = useState("");
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!land);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!readOnlyContract) return;

    readOnlyContract.owner()
      .then((value: string) => setContractOwner(value))
      .catch((error: unknown) => console.error("Error fetching contract owner:", error));
  }, [readOnlyContract]);

  useEffect(() => {
    if (!readOnlyContract || !owner || landIndex === "") return;

    let isMounted = true;

    const fetchLand = async () => {
      setIsLoading(true);
      try {
        const parsedIndex = Number(landIndex);
        const landDetails = await readOnlyContract.getLandDetails(owner, parsedIndex);

        if (Number(landDetails.numberOfPlots) === 0) {
          toast.error("Record not found");
          if (isMounted) setLand(null);
          return;
        }

        let listingPricePerPlot: string | null = null;
        let listingId: number | null = null;
        const activeListingId = Number(landDetails.activeListingId);

        if (landDetails.isListed && activeListingId > 0) {
          const listing = await readOnlyContract.listings(activeListingId);
          if (listing.active) {
            listingPricePerPlot = formatEther(listing.listingPricePerPlot);
            listingId = Number(listing.listingId);
          }
        }

        if (isMounted) {
          setLand({
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
            landIndex: parsedIndex,
            listingId,
            activeListingId,
          });
        }
      } catch (error) {
        console.error("Error fetching record:", error);
        toast.error("Failed to fetch record");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLand();

    return () => {
      isMounted = false;
    };
  }, [landIndex, owner, readOnlyContract]);

  useEffect(() => {
    if (!readOnlyContract || !land?.titleNumber) return;
    let isMounted = true;

    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const records: HistoryRecord[] = [];
        for (let index = 0; index < 25; index += 1) {
          try {
            const entry = await readOnlyContract.landHistoricalData(land.titleNumber, index);
            records.push({
              soldFrom: String(entry.soldFrom),
              soldTo: String(entry.soldTo),
              amount: BigInt(entry.amount),
              numberOfPlots: BigInt(entry.numberofPlots),
              date: BigInt(entry.date),
            });
          } catch {
            break;
          }
        }
        if (isMounted) setHistory(records);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        if (isMounted) setIsHistoryLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [land?.titleNumber, readOnlyContract]);

  const isRecordOwner = Boolean(address && land?.landOwner && address.toLowerCase() === land.landOwner.toLowerCase());
  const isVerifier = Boolean(address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase());
  const displayPricePerPlot = land?.listingPricePerPlot ?? land?.assessedValuePerPlot ?? "0";
  const totalPrice = useMemo(
    () => Number(displayPricePerPlot) * Number(land?.numberOfPlots ?? 0),
    [displayPricePerPlot, land?.numberOfPlots]
  );
  const latestHistory = history.length > 0 ? history[history.length - 1] : null;
  const previousOwner =
    history.length > 1
      ? history[history.length - 2].soldTo
      : latestHistory?.soldFrom && latestHistory.soldFrom !== ZERO_ADDRESS
        ? latestHistory.soldFrom
        : null;

  const handleVerifyClick = async () => {
    if (!land) return;
    try {
      setIsVerifying(true);
      await verifyLand({ landOwner: land.landOwner, landIndex: land.landIndex });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!land?.listingId) {
      toast.error("Listing is missing its listing ID");
      return;
    }

    try {
      setIsPurchaseLoading(true);
      await buyLand(land.listingId);
      setIsConfirmOpen(false);
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="flex min-h-[60vh] items-center justify-center rounded-[1rem] border border-[rgba(180,140,90,0.1)] bg-[#0f1726]/82">
          <Loader />
        </div>
      </div>
    );
  }

  if (!land) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="rounded-[1rem] border border-[rgba(180,140,90,0.14)] bg-[#141d2e] p-10 text-center text-[rgba(255,255,255,0.72)]">
          Property not found.
        </div>
      </div>
    );
  }

  const imageUrl = land.imageCID ? `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${land.imageCID}` : image;

  return (
    <>
      <div className="mx-auto max-w-[1180px] space-y-4 px-4 py-4 md:px-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.58)] transition hover:text-[#f3eadc]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back To Registry
        </button>

        <section className="overflow-hidden rounded-[1.15rem] border border-[rgba(180,140,90,0.18)] bg-[#f6efe4] shadow-[0_8px_40px_rgba(0,0,0,0.12)]">
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="relative h-[340px] overflow-hidden bg-[#d9c2a2] lg:h-[420px]">
              <img
                src={imageUrl}
                alt={`Land parcel FG-${land.titleNumber}`}
                className="h-full w-full object-cover"
              />
              {/* Bottom gradient for text readability, no right-side wipe */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge
                  label={land.isVerified ? "Verified Property" : "Pending Verification"}
                  tone={land.isVerified ? "verified" : "warning"}
                />
                <Badge label={land.isListed ? "For Sale" : "Not Listed"} tone="neutral" />
              </div>
              {/* Location pill on the image */}
              <div className="absolute bottom-4 left-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-1.5 text-[13px] text-white/90 backdrop-blur-md">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{land.city}, {land.lga}, {land.state}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-6 px-6 py-6 lg:px-10 lg:py-10">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7e714f]">Land Title</p>
                <h1 className="mt-3 font-serif text-[3rem] leading-tight text-[#2C1A0E]">FG-{land.titleNumber}</h1>
                <p className="mt-3 text-sm font-medium text-[#8a7456] opacity-80">{land.numberOfPlots} plots · {land.assessedValuePerPlot} DLR per plot</p>
              </div>

              <div className="space-y-4 lg:max-w-md">
                <div className={`inline-flex rounded-[0.85rem] border px-4 py-3 text-sm font-semibold ${land.isVerified
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-amber-300 bg-amber-50 text-amber-800"
                  }`}>
                  {land.isVerified ? "Verified — ready for listing or sale" : "Pending verification before listing"}
                </div>

                <div className="flex flex-wrap gap-3">
                  {!land.isVerified && isVerifier && (
                    <button
                      className="rounded-[0.85rem] border border-emerald-300 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                      onClick={handleVerifyClick}
                      disabled={isVerifying}
                    >
                      {isVerifying ? "Verifying..." : "Verify Property"}
                    </button>
                  )}
                  {land.isListed && !isRecordOwner && (
                    <button
                      className="rounded-[0.85rem] bg-primary px-6 py-3 text-sm font-semibold text-gray-950 transition hover:brightness-110"
                      onClick={() => setIsConfirmOpen(true)}
                    >
                      Buy Property
                    </button>
                  )}
                  {isRecordOwner && (
                    <ListLandButton
                      land={land}
                      buttonText={land.isListed ? "Cancel Listing" : "List for Sale"}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid border-t-2 border-[rgba(180,140,90,0.15)] bg-[#f9f2e8] lg:grid-cols-3">
            <Panel title="Property Summary">
              <Metric label="Total Plots" value={`${land.numberOfPlots}`} />
              <Metric label="Current Status" value={land.isListed ? "Listed" : "Not Listed"} />
              <Metric label="Assessed Value / Plot" value={`${land.assessedValuePerPlot} DLR`} />
              <Metric label="Listing Price / Plot" value={land.listingPricePerPlot ? `${land.listingPricePerPlot} DLR` : "Not published"} />
            </Panel>

            <Panel title="Registry Context">
              <p className="text-sm leading-7 text-[#6f5b45]">
                This property captures the parcel identity, ownership reference, and uploaded title-supporting documents. Listing the property for sale is a separate step.
              </p>
              <div className="mt-5 rounded-[0.9rem] border border-[#e6d6bc] bg-[#f5ebd7] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b815e]">Supporting Document</p>
                <div className="mt-3">
                  {land.coFoCID ? (
                    <a
                      href={`https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${land.coFoCID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-[0.85rem] border border-[#d8c19d] bg-white px-4 py-3 text-sm font-medium text-[#a77a45] transition hover:bg-[#f4e7cf]"
                    >
                      <FileText className="h-4 w-4" />
                      Open Certificate Document
                    </a>
                  ) : (
                    <p className="text-sm text-[#8c7352]">No certificate document is attached to this property.</p>
                  )}
                </div>
              </div>
            </Panel>

            <Panel title="Ownership History">
              <Metric label="Current Owner" value={shortenAddress(land.landOwner)} />
              <Metric label="Previous Owner" value={previousOwner ? shortenAddress(previousOwner) : "Original registration"} />

              <div className="mt-5 space-y-4">
                {isHistoryLoading ? (
                  <p className="text-sm text-[#9f937c]">Loading ownership history...</p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-[#9f937c]">No ownership history is available yet.</p>
                ) : (
                  history.map((entry, index) => {
                    const isRegistration = entry.soldFrom === ZERO_ADDRESS;
                    return (
                      <div key={`${entry.soldTo}-${entry.date.toString()}-${index}`} className="flex gap-3">
                        <div className="mt-1 flex flex-col items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${isRegistration ? "bg-[#c7a26a]" : "bg-[#6ca042]"}`} />
                          {index !== history.length - 1 && <span className="mt-2 h-12 w-px bg-[rgba(180,140,90,0.18)]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#2C1A0E]">
                              {isRegistration ? "Initial Registration" : "Ownership Transfer"}
                            </p>
                            <span className="text-xs uppercase tracking-[0.12em] text-[#8f836d]">
                              {formatHistoryDate(entry.date)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#6f5b45]">
                            {isRegistration
                              ? `Registered to ${shortenAddress(entry.soldTo)}`
                              : `${shortenAddress(entry.soldFrom)} → ${shortenAddress(entry.soldTo)}`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs uppercase tracking-[0.08em] text-[#8f836d]">
                            <span>{entry.numberOfPlots.toString()} plots</span>
                            <span>{isRegistration ? "Initial record" : `${formatHistoryAmount(entry.amount)} DLR`}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Panel>
          </div>

        </section>
      </div>

      <FullModal isOpen={isConfirmOpen} fullWidth={true} onClose={() => setIsConfirmOpen(false)}>
        <div className="mx-auto max-w-2xl rounded-[1rem] bg-white p-6 shadow-xl">
          <div className="border-b border-gray-100 pb-4">
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Purchase Confirmation</p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">Confirm Property Purchase</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Review the listing price and approve the token spend before the ownership transfer is executed.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <LightMetric label="Title Number" value={`FG-${land.titleNumber}`} />
            <LightMetric label="Location" value={`${land.city}, ${land.lga}, ${land.state}`} />
            <LightMetric label="Plots" value={`${land.numberOfPlots}`} />
            <LightMetric label="Listing Price / Plot" value={`${displayPricePerPlot} DLR`} />
          </div>
          <div className="mt-6 rounded-[0.9rem] border border-primary/20 bg-primary/5 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-700">Total transfer value</span>
              <span className="text-xl font-semibold text-gray-900">{totalPrice} DLR</span>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              className="rounded-[0.85rem] border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isPurchaseLoading}
            >
              Cancel
            </button>
            <button
              className="rounded-[0.85rem] bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              onClick={handleConfirmPurchase}
              disabled={isPurchaseLoading}
            >
              {isPurchaseLoading ? "Processing..." : "Confirm Purchase"}
            </button>
          </div>
        </div>
      </FullModal>
    </>
  );
};

const Badge = ({ label, tone }: { label: string; tone: "verified" | "warning" | "neutral" }) => {
  const className =
    tone === "verified"
      ? "border-emerald-400/60 bg-emerald-600/80 text-white"
      : tone === "warning"
        ? "border-amber-400/60 bg-amber-600/80 text-white"
        : "border-white/20 bg-black/40 text-white/90";

  return <span className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md shadow-sm ${className}`}>{label}</span>;
};

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-[rgba(180,140,90,0.1)] px-6 py-7 lg:border-t-0 lg:border-r lg:border-[rgba(180,140,90,0.1)] lg:px-8 last:border-r-0">
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9b815e]">{title}</p>
    <div className="mt-5 space-y-4">{children}</div>
  </section>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7e714f]">{label}</p>
    <p className="mt-2 text-sm font-semibold text-[#2C1A0E]">{value}</p>
  </div>
);

const LightMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[0.9rem] border border-gray-200 bg-gray-50 px-4 py-4">
    <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
    <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

const shortenAddress = (value: string) => {
  if (!value) return "Unknown";
  if (value.toLowerCase() === ZERO_ADDRESS) return "Registry Genesis";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const formatHistoryDate = (value: bigint) => {
  if (!value || value === BigInt(0)) return "Unknown date";
  return new Date(Number(value) * 1000).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatHistoryAmount = (value: bigint) => Number(value) / 1e18;

export default RecordDetails;
