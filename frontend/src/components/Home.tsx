import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "react-toastify";
import useRunners from "../hooks/useRunners";
import globe from "../assets/globe3.png";
import { ArrowRight } from "lucide-react";

const Home = (): JSX.Element => {
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const { address } = useAppKitAccount();
    const { signer } = useRunners();
    const navigate = useNavigate();
    const location = useLocation();
    const previousAddressRef = useRef<string | undefined>(address);

    useEffect(() => {
        setIsWalletConnected(!!signer);
    }, [signer]);

    useEffect(() => {
        const previousAddress = previousAddressRef.current;
        const isFreshConnection = !previousAddress && !!address;

        if (isFreshConnection && location.pathname === "/") {
            navigate("/dashboard", { replace: true });
        }

        previousAddressRef.current = address;
    }, [address, location.pathname, navigate]);

    const handleViewListings = () => {
        navigate("/listings");
    };

    const handleRegisterLand = () => {
        if (isWalletConnected) {
            navigate("/register");
        } else {
            toast.info("Connect your wallet to register a land title");
        }
    };

    return (
        <div className="mx-auto mt-10 max-w-screen-2xl px-4 py-10 md:mt-14 lg:py-16">
            <div className="bg-transparent">
                <div className="grid gap-8 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 xl:px-14">
                    <div className="mr-auto flex max-w-4xl flex-col justify-center">
                        <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-5xl xl:text-6xl">
                            Modern Land Registry for Secure Property Titles and Verified History.
                        </h1>

                        <p className="mt-6 max-w-2xl text-base leading-8 text-gray-300 md:text-lg">
                            Delar empowers owners to register land titles, preserve verifiable ownership
                            heritage on-chain, and list properties for sale with total transparency.
                        </p>

                        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                            <button
                                onClick={handleViewListings}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white transition hover:brightness-110"
                            >
                                Browse Marketplace
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleRegisterLand}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-transparent px-6 py-3 text-base font-semibold text-white transition hover:bg-white hover:text-gray-900"
                            >
                                Register Land Title
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:flex lg:items-center lg:justify-center">
                        <div className="relative flex w-full max-w-[34rem] items-center justify-center">
                            <img
                                src={globe}
                                alt="DELAR registry overview"
                                className="home-globe max-h-[32rem] w-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home;
