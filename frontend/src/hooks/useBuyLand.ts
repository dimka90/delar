import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useContract from "./useContract";
import useTokenContract from "./useTokenContract";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";
import { MaxUint256 } from "ethers";

const useBuyLand = () => {
    const delarContract = useContract(true);
    const readOnlyDelarContract = useContract();
    const tokenContract = useTokenContract(true);
    const readOnlyTokenContract = useTokenContract();
    const { address } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();
    const navigate = useNavigate();

    return useCallback(
        async (listingId: number) => {
            if (listingId === undefined) {
                toast.error("Missing field(s)");
                return;
            }

            if (!address) {
                toast.error("Connect your wallet!");
                console.log("Current chain:", chainId);
                console.log("Base sepolia:", baseSepolia.id);
                return;
            }

            if (chainId !== baseSepolia.chainId) {
                toast.error("You are not connected to the right network");
                return;
            }

            if (!delarContract || !readOnlyDelarContract || !tokenContract || !readOnlyTokenContract) {
                toast.error("Cannot get contracts!");
                return;
            }

            try {
                const listing = await readOnlyDelarContract.listings(listingId);
                const land = await readOnlyDelarContract.getLandDetails(listing.owner, listing.landIndex);
                const totalPrice = BigInt(listing.listingPricePerPlot) * BigInt(land.numberOfPlots);

                console.log("Total Price", totalPrice);
                const balance = await readOnlyTokenContract.balanceOf(address);
                if (balance < totalPrice) {
                    toast.error("You don't have enough DelarTokens for this purchase");
                    return;
                }

                // Check current allowance
                const currentAllowance = await readOnlyTokenContract.allowance(
                    address,
                    delarContract.target
                );

                // If allowance is insufficient, request approval
                if (currentAllowance < totalPrice) {
                    toast.info("Approving DelarToken spending...");

                    try {
                        const approvalTx = await tokenContract.approve(
                            delarContract.target,
                            MaxUint256 // Approve maximum amount to avoid repeated approvals
                        );

                        toast.info("Waiting for approval confirmation...");
                        await approvalTx.wait();
                        toast.success("Approval successful!");
                    } catch (approvalError) {
                        console.error("Error while approving tokens: ", approvalError);
                        toast.error(
                            "Failed to approve tokens: " +
                            (approvalError instanceof Error ? approvalError.message : "Unknown error")
                        );
                        return;
                    }
                }

                const estimatedGas = await delarContract.buyLand.estimateGas(listingId);

                const tx = await delarContract.buyLand(listingId, {
                    gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
                });

                toast.info("Transaction submitted, waiting for confirmation...");
                const receipt = await tx.wait();

                if (receipt.status === 1) {
                    toast.success("You have successfully purchased this land");
                    navigate("/lands/user");
                    return;
                }

                toast.error("Land purchase failed");
                return;
            } catch (error) {
                console.error("Error while purchasing land: ", error);
                toast.error(
                    "Land purchase failed: " +
                    (error instanceof Error ? error.message : "Unknown error")
                );
            }
        },
        [address, chainId, delarContract, navigate, readOnlyDelarContract, readOnlyTokenContract, tokenContract]
    );
};

export default useBuyLand;
