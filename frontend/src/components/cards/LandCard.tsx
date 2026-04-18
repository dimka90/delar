import { useNavigate } from "react-router-dom";
import { BadgeCheck, Landmark, MapPin, ScanSearch } from "lucide-react";
import image from "../../assets/land3.png";
import { Land } from "../../pages/LandsForSale.tsx";

const LandCard = (land: Land): JSX.Element => {
    const navigate = useNavigate();
    const displayPrice = land.listingPricePerPlot ?? land.assessedValuePerPlot;

    const handleViewMore = () => {
        navigate(`/record/${land.landOwner}/${land.landIndex}`, {
            state: { land },
        });
    };

    return (
        <div className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative h-56 overflow-hidden">
                <img
                    src={land.imageCID ? `https://${import.meta.env.VITE_PINATA_GATEWAY}/ipfs/${land.imageCID}` : image}
                    alt="land"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <StatusPill
                        tone={land.isVerified ? "verified" : "neutral"}
                        icon={<BadgeCheck className="h-3.5 w-3.5" />}
                        label={land.isVerified ? "Verified" : "Pending Verification"}
                    />
                    <StatusPill
                        tone={land.isListed ? "listed" : "neutral"}
                        icon={<Landmark className="h-3.5 w-3.5" />}
                        label={land.isListed ? "For Sale" : "Not Listed"}
                    />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate capitalize">{land.city}, {land.lga}, {land.state}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Title Reference</p>
                        <h3 className="mt-2 text-xl font-semibold text-gray-900">FG-{land.titleNumber}</h3>
                    </div>
                    <div className="rounded-2xl bg-gray-100 px-4 py-2 text-right">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Plots</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">{land.numberOfPlots}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <MetricCard
                        label={land.isListed ? "Listing Price / Plot" : "Assessed Value / Plot"}
                        value={`${displayPrice} USDT`}
                    />
                    <MetricCard
                        label="Property Status"
                        value={land.isListed ? "For Sale" : "Not Listed"}
                    />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Property Info</p>
                        <p className="mt-1 text-sm text-gray-700">
                            {land.isListed
                                ? "This property is available for purchase"
                                : "Registered property, not currently for sale"}
                        </p>
                    </div>
                    <button
                        onClick={handleViewMore}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary"
                    >
                        <ScanSearch className="h-4 w-4" />
                        View Property
                    </button>
                </div>
            </div>
        </div>
    );
};

interface StatusPillProps {
    tone: "verified" | "listed" | "neutral";
    icon: JSX.Element;
    label: string;
}

const StatusPill = ({ tone, icon, label }: StatusPillProps) => {
    const toneClass =
        tone === "verified"
            ? "bg-emerald-100/95 text-emerald-900"
            : tone === "listed"
                ? "bg-primary/90 text-white"
                : "bg-white/90 text-gray-800";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClass}`}>
            {icon}
            {label}
        </span>
    );
};

interface MetricCardProps {
    label: string;
    value: string;
}

const MetricCard = ({ label, value }: MetricCardProps) => (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
    </div>
);

export default LandCard;
