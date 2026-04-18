import { useMemo, useCallback, useState, useEffect } from "react";
import useRunners from "./useRunners";
import useContract from "./useContract";
import { Contract } from "ethers";
import NFT_ABI from "../ABI/DelarNFT.json";

const useNftContract = (withSigner = false) => {
    const { readOnlyProvider, signer } = useRunners();
    const mainContract = useContract(withSigner);
    const [nftAddress, setNftAddress] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNftAddress = async () => {
            if (!mainContract) {
                setLoading(false);
                return;
            }

            try {
                const address = import.meta.env.VITE_NFT_CONTRACT_ADDRESS;
                setNftAddress(address);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch NFT address:", err);
                setError("Failed to fetch NFT contract address");
            } finally {
                setLoading(false);
            }
        };

        fetchNftAddress();
    }, [mainContract]);

    // Create the NFT contract instance
    const nftContract = useMemo(() => {
        if (!nftAddress || loading) return null;

        try {
            if (withSigner) {
                if (!signer) return null;
                return new Contract(nftAddress, NFT_ABI, signer);
            }
            return new Contract(nftAddress, NFT_ABI, readOnlyProvider);
        } catch (err) {
            console.error("Failed to create NFT contract instance:", err);
            return null;
        }
    }, [nftAddress, readOnlyProvider, signer, withSigner, loading]);

    /**
     * Set approval for the main contract to manage NFTs on behalf of the current user
     */
    const setApprovalForAll = useCallback(async () => {
        if (!nftContract || !mainContract) {
            throw new Error("Contracts not initialized");
        }

        try {
            const tx = await nftContract.setApprovalForAll(mainContract.target, true);
            return await tx.wait();
        } catch (err) {
            console.error("Failed to set approval:", err);
            throw err;
        }
    }, [nftContract, mainContract]);

    /**
     * Check if the main contract is approved to manage NFTs on behalf of the address
     * @param address The address to check approval for
     */
    const isApprovedForAll = useCallback(
        async (address: string) => {
            if (!nftContract || !mainContract || !address) {
                return false;
            }

            try {
                return await nftContract.isApprovedForAll(address, mainContract.target);
            } catch (err) {
                console.error("Failed to check approval status:", err);
                return false;
            }
        },
        [nftContract, mainContract]
    );

    return {
        nftContract,
        loading,
        error,
        setApprovalForAll,
        isApprovedForAll,
        nftAddress
    };
};

export default useNftContract;