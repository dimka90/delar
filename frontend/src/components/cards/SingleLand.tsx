import React, { useEffect, useMemo, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { BadgeCheck, FileText, Landmark, MapPin, ScrollText, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";
import image from "../../assets/land3.png";
import useBuyLand from "../../hooks/useBuyLand";
import useContract from "../../hooks/useContract";
import useVerifyLand from "../../hooks/useVerifyLand";
import { Land } from "../../pages/LandsForSale.tsx";
import ListLandButton from "../ListLandButton.tsx";
import FullModal from "../modals/FullModal.tsx";

interface SingleLandProps {
    land: Land;
}

interface HistoryRecord {
    soldFrom: string;
    soldTo: string;
    amount: bigint;
    numberOfPlots: bigint;
    date: bigint;
}

const SingleLand: React.FC<SingleLandProps> = ({ land }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [contractOwner, setContractOwner] = useState("");
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const imageUrl = land.imageCID ? `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${land.imageCID}` : image;
    const { address } = useAppKitAccount();
    const readOnlyContract = useContract();
    const buyLand = useBuyLand();
    const verifyLand = useVerifyLand();
    const displayPricePerPlot = land.listingPricePerPlot ?? land.assessedValuePerPlot;
    const totalPrice = useMemo(
        () => Number(displayPricePerPlot) * Number(land.numberOfPlots),
        [displayPricePerPlot, land.numberOfPlots]
    );
    const isRecordOwner = Boolean(
        address &&
        land.landOwner &&
        address.toLowerCase() === land.landOwner.toLowerCase()
    );
    const isVerifier = Boolean(
        address &&
        contractOwner &&
        address.toLowerCase() === contractOwner.toLowerCase()
    );

    useEffect(() => {
        if (!readOnlyContract) return;

        let isMounted = true;

        readOnlyContract.owner()
            .then((ownerAddress: string) => {
                if (isMounted) {
                    setContractOwner(ownerAddress);
                }
            })
            .catch((error: unknown) => {
                console.error("Error fetching contract owner:", error);
            });

        return () => {
            isMounted = false;
        };
    }, [readOnlyContract]);

    useEffect(() => {
        if (!readOnlyContract || !land.titleNumber) return;

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

                if (isMounted) {
                    setHistory(records);
                }
            } catch (error) {
                console.error("Error fetching land history:", error);
            } finally {
                if (isMounted) {
                    setIsHistoryLoading(false);
                }
            }
        };

        fetchHistory();

        return () => {
            isMounted = false;
        };
    }, [land.titleNumber, readOnlyContract]);

    const latestHistory = history.length > 0 ? history[history.length - 1] : null;
    const previousOwner =
        history.length > 1
            ? history[history.length - 2].soldTo
            : latestHistory?.soldFrom && latestHistory.soldFrom !== ZERO_ADDRESS
                ? latestHistory.soldFrom
                : null;

    const handleBuyClick = () => {
        setIsModalOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!address) {
            toast.error("Please connect your wallet first");
            return;
        }

        try {
            setIsPurchaseLoading(true);
            if (!land.listingId) {
                toast.error("Listing is missing its listing ID");
                return;
            }

            await buyLand(land.listingId);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Purchase error:", error);
        } finally {
            setIsPurchaseLoading(false);
        }
    };

    const handleVerifyClick = async () => {
        try {
            setIsVerifying(true);
            await verifyLand({
                landOwner: land.landOwner,
                landIndex: land.landIndex,
            });
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <>
            <div className="mx-auto max-h-[88vh] w-full max-w-[660px] overflow-y-auto rounded-[1.75rem] bg-[#f6efe4] shadow-2xl">
                <section className="relative h-[17rem] overflow-hidden bg-[#2C1A0E] sm:h-[19rem]">
                    <img
                        src={imageUrl}
                        alt={`Land parcel FG-${Number(land.titleNumber)}`}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C1A0E]/88 via-[#2C1A0E]/20 to-transparent" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <RecordBadge
                            icon={<BadgeCheck className="h-4 w-4" />}
                            label={land.isVerified ? "Verified Record" : "Pending Verification"}
                            tone={land.isVerified ? "verified" : "warning"}
                        />
                        <RecordBadge
                            icon={<Landmark className="h-4 w-4" />}
                            label={land.isListed ? "Listed for Transfer" : "Registry Record"}
                            tone={land.isListed ? "listed" : "neutral"}
                        />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10 sm:px-6 sm:pb-6">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">Property Record</p>
                        <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
                            FG-{Number(land.titleNumber)}
                        </h2>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 text-sm text-white backdrop-blur-sm">
                            <MapPin className="h-4 w-4" />
                            <span className="capitalize">{land.city}, {land.lga}, {land.state}</span>
                        </div>
                    </div>
                </section>

                <div className="space-y-5 p-5 sm:p-6">
                    <StatusBanner land={land} />

                    <section className="rounded-[1.35rem] border border-[#e6d6bc] bg-[#fcf7ef] p-5 shadow-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#9b815e]">Record Summary</p>
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <DetailMetric label="Plots" value={`${land.numberOfPlots}`} />
                            <DetailMetric label="Current Status" value={land.isListed ? "Listed" : "Not Listed"} />
                            <DetailMetric label="Assessed Value / Plot" value={`${land.assessedValuePerPlot} DLR`} />
                            <DetailMetric
                                label="Listing Price / Plot"
                                value={land.listingPricePerPlot ? `${land.listingPricePerPlot} DLR` : "Not published"}
                            />
                        </div>
                    </section>

                    <section className="rounded-[1.35rem] border border-[#e6d6bc] bg-[#fcf7ef] p-5 shadow-sm">
                        <SectionTitle
                            icon={<ScrollText className="h-5 w-5" />}
                            title="Registry Context"
                            description="This record captures the parcel identity, ownership reference, and uploaded title-supporting documents. Listing the property is a separate commercial step."
                        />

                        <div className="mt-4 rounded-2xl border border-[#e6d6bc] bg-[#f5ebd7] px-4 py-4 text-sm text-[#6a5132]">
                            <div className="flex items-start gap-3">
                                {land.isVerified ? (
                                    <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-700" />
                                ) : (
                                    <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
                                )}
                                <p>
                                    {land.isVerified
                                        ? "This record is marked verified and can be listed or transferred under the current flow."
                                        : "This record is not yet verified. It should not be treated as an active sale record until verification is complete."}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[1.35rem] border border-[#e6d6bc] bg-[#fcf7ef] p-5 shadow-sm">
                        <SectionTitle
                            icon={<Landmark className="h-5 w-5" />}
                            title="Ownership History"
                            description="Review the current owner and every recorded transfer for this title reference."
                        />

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <DetailMetric label="Current Owner" value={shortenAddress(land.landOwner)} />
                            <DetailMetric
                                label="Previous Owner"
                                value={previousOwner ? shortenAddress(previousOwner) : "Original registration"}
                            />
                        </div>

                        <div className="mt-4 rounded-[1.15rem] border border-[#e6d6bc] bg-white">
                            {isHistoryLoading ? (
                                <div className="px-4 py-6 text-sm text-[#8c7352]">Loading ownership history...</div>
                            ) : history.length === 0 ? (
                                <div className="px-4 py-6 text-sm text-[#8c7352]">No ownership history is available yet.</div>
                            ) : (
                                <div className="space-y-0">
                                    {history.map((entry, index) => {
                                        const isRegistration = entry.soldFrom === ZERO_ADDRESS;
                                        return (
                                            <div
                                                key={`${entry.soldTo}-${entry.date.toString()}-${index}`}
                                                className={`flex gap-4 px-4 py-4 ${index !== history.length - 1 ? "border-b border-[#f0e4d0]" : ""}`}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span
                                                        className={`mt-1 h-3 w-3 rounded-full ${
                                                            isRegistration ? "bg-[#8f6a3c]" : "bg-emerald-600"
                                                        }`}
                                                    />
                                                    {index !== history.length - 1 && (
                                                        <span className="mt-2 h-full w-px bg-[#e8d7bb]" />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-[#2C1A0E]">
                                                                {isRegistration ? "Initial registration" : "Ownership transfer"}
                                                            </p>
                                                            <p className="mt-1 text-sm text-[#7a6040]">
                                                                {isRegistration
                                                                    ? `Registered to ${shortenAddress(entry.soldTo)}`
                                                                    : `${shortenAddress(entry.soldFrom)} → ${shortenAddress(entry.soldTo)}`}
                                                            </p>
                                                        </div>
                                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#9b815e]">
                                                            {formatHistoryDate(entry.date)}
                                                        </p>
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#8c7352]">
                                                        <span>{entry.numberOfPlots.toString()} plots</span>
                                                        <span>{isRegistration ? "Initial record" : `${formatHistoryAmount(entry.amount)} DLR`}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-[1.35rem] border border-[#e6d6bc] bg-[#fcf7ef] p-5 shadow-sm">
                        <SectionTitle
                            icon={<FileText className="h-5 w-5" />}
                            title="Supporting Documents"
                            description="Review the uploaded certificate file attached to this record."
                        />

                        <div className="mt-4">
                            {land.coFoCID ? (
                                <a
                                    href={`https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${land.coFoCID}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl border border-[#d8c19d] bg-white px-4 py-3 text-sm font-medium text-[#a77a45] transition hover:bg-[#f4e7cf]"
                                >
                                    <FileText className="h-4 w-4" />
                                    Open Certificate Document
                                </a>
                            ) : (
                                <p className="text-sm text-[#8c7352]">No certificate document is attached to this record.</p>
                            )}
                        </div>
                    </section>

                    <section className="rounded-[1.35rem] border border-[#e6d6bc] bg-[#fcf7ef] p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-[#9b815e]">Transfer Summary</p>
                                <h3 className="mt-2 text-lg font-semibold text-[#2C1A0E]">
                                    Total at current price: {totalPrice} DLR
                                </h3>
                            </div>
                            <div className="text-right text-sm text-[#7a6040]">
                                <p>{land.numberOfPlots} plots</p>
                                <p>{displayPricePerPlot} DLR per plot</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                            {!land.isVerified && isVerifier && (
                                <button
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={handleVerifyClick}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? "Verifying..." : "Verify Record"}
                                </button>
                            )}
                            {land.isListed && !isRecordOwner && (
                                <button
                                    className="rounded-xl bg-[#2C1A0E] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                                    onClick={handleBuyClick}
                                >
                                    Purchase Listed Property
                                </button>
                            )}
                            {isRecordOwner && (
                                <ListLandButton
                                    land={land}
                                    buttonText={land.isListed ? "Cancel Listing" : "Publish Listing"}
                                />
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <FullModal isOpen={isModalOpen} fullWidth={true} onClose={() => setIsModalOpen(false)}>
                <div className="mx-auto max-w-2xl rounded-[1.5rem] bg-white p-6 shadow-xl">
                    <div className="border-b border-gray-100 pb-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Purchase Confirmation</p>
                        <h2 className="mt-2 text-2xl font-semibold text-gray-900">Confirm Property Transfer</h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                            Review the listing price and approve the token spend before the ownership transfer is executed.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <DetailMetric label="Title Number" value={`FG-${Number(land.titleNumber)}`} />
                        <DetailMetric label="Location" value={`${land.city}, ${land.lga}, ${land.state}`} />
                        <DetailMetric label="Plots" value={`${land.numberOfPlots}`} />
                        <DetailMetric label="Listing Price / Plot" value={`${displayPricePerPlot} DLR`} />
                    </div>

                    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-medium text-gray-700">Total transfer value</span>
                            <span className="text-xl font-semibold text-gray-900">{totalPrice} DLR</span>
                        </div>
                    </div>

                    <div className="mt-6 text-sm leading-6 text-gray-600">
                        <p>By continuing:</p>
                        <ul className="mt-2 list-decimal space-y-1 pl-5">
                            <li>You approve DELAR token spending for this transfer.</li>
                            <li>The listed property record will be transferred to your address.</li>
                            <li>The sale is recorded as part of the property history after confirmation.</li>
                        </ul>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isPurchaseLoading}
                        >
                            Cancel
                        </button>
                        <button
                            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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

interface RecordBadgeProps {
    icon: JSX.Element;
    label: string;
    tone: "verified" | "listed" | "neutral" | "warning";
}

const RecordBadge = ({ icon, label, tone }: RecordBadgeProps) => {
    const toneClass =
        tone === "verified"
            ? "bg-emerald-100/95 text-emerald-900"
            : tone === "listed"
                ? "bg-[#7d6742]/95 text-white"
                : tone === "warning"
                    ? "bg-amber-100/95 text-amber-900"
                    : "bg-white/90 text-[#5b472c]";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}>
            {icon}
            {label}
        </span>
    );
};

const StatusBanner = ({ land }: { land: Land }) => (
    <div
        className={`rounded-full border px-4 py-3 text-sm font-medium ${
            land.isVerified
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
    >
        {land.isVerified ? "Verified and ready for listing or transfer" : "Pending verification before listing"}
    </div>
);

const SectionTitle = ({
    icon,
    title,
    description,
}: {
    icon: JSX.Element;
    title: string;
    description: string;
}) => (
    <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2e4cf] text-[#a77a45]">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-semibold text-[#2C1A0E]">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-[#7a6040]">{description}</p>
        </div>
    </div>
);

interface DetailMetricProps {
    label: string;
    value: string;
}

const DetailMetric = ({ label, value }: DetailMetricProps) => (
    <div className="rounded-[1rem] border border-[#e6d6bc] bg-[#f5ebd7] px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#9b815e]">{label}</p>
        <p className="mt-2 text-sm font-semibold text-[#2C1A0E]">{value}</p>
    </div>
);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

const formatHistoryAmount = (value: bigint) => {
    return Number(value) / 1e18;
};

export default SingleLand;
