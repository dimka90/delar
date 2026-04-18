import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useContract from "./useContract";
import useNftContract from "./useNftContract";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";
import { parseEther } from "viem";

const useListLand = () => {
  const contract = useContract(true);
  const { isApprovedForAll, setApprovalForAll } = useNftContract(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const navigate = useNavigate();

  return useCallback(
    async ({
      landIndex,
      listingId,
      isListed,
      listingPricePerPlot,
    }: {
      landIndex: number;
      listingId?: number | null;
      isListed: boolean;
      listingPricePerPlot?: string;
    }) => {
      if (landIndex === undefined) {
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

      if (!contract) {
        toast.error("Cannot get contract!");
        return;
      }

      try {
        if (isListed) {
          if (!listingId) {
            toast.error("Listing ID not found for this land");
            return;
          }

          const estimatedGas = await contract.cancelListing.estimateGas(listingId);
          const tx = await contract.cancelListing(listingId, {
            gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
          });

          toast.info("Transaction submitted, waiting for confirmation...");
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            toast.success("Listing cancelled successfully");
            navigate("/lands/user");
            return;
          }

          toast.error("Failed to cancel listing");
          return;
        }

        if (!listingPricePerPlot || Number(listingPricePerPlot) <= 0) {
          toast.error("Enter a valid listing price per plot");
          return;
        }

        const approved = await isApprovedForAll(address);
        if (!approved) {
          toast.info("Approving property token transfer...");
          await setApprovalForAll();
          toast.success("Property token approved for listing");
        }

        const listingPriceInWei = parseEther(listingPricePerPlot);

        const estimatedGas = await contract.listLand.estimateGas(
          landIndex,
          listingPriceInWei
        );

        const tx = await contract.listLand(landIndex, listingPriceInWei, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        toast.info("Transaction submitted, waiting for confirmation...");
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Land listed successfully");
          navigate("/lands/user");
          return;
        }
        toast.error("Land listing failed");
        return;
      } catch (error) {
        console.error("Error while updating listing: ", error);
        toast.error(
          "Listing update failed: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      }
    },
    [address, chainId, contract, isApprovedForAll, navigate, setApprovalForAll]
  );
};

export default useListLand;
