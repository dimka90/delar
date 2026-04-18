import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useContract from "./useContract";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";

const useVerifyLand = () => {
  const contract = useContract(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const navigate = useNavigate();

  return useCallback(
    async ({ landOwner, landIndex }: { landOwner: string; landIndex: number }) => {
      if (!landOwner || landIndex === undefined) {
        toast.error("Missing verification details");
        return;
      }

      if (!address) {
        toast.error("Connect your wallet!");
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
        const estimatedGas = await contract.verifyLand.estimateGas(landOwner, landIndex);
        const tx = await contract.verifyLand(landOwner, landIndex, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        toast.info("Verification submitted, waiting for confirmation...");
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Land verified successfully");
          navigate(0);
          return;
        }

        toast.error("Land verification failed");
      } catch (error) {
        console.error("Error while verifying land:", error);
        toast.error(
          "Land verification failed: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      }
    },
    [address, chainId, contract, navigate]
  );
};

export default useVerifyLand;
