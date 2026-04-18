import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useContract from "./useContract";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";
import { parseEther } from "viem";

const useRegisterLand = () => {
  const contract = useContract(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const navigate = useNavigate();

  return useCallback(
      async (
          numberOfPlots: number,
          state: string,
          lga: string,
          city: string,
          assessedValuePerPlot: number,
          titleNumber: number,
          imageCID: string,
          coFoCID: string
      ) => {
        // Input validation
        if (
            numberOfPlots === undefined ||
            !state ||
            !lga ||
            !city ||
            assessedValuePerPlot === undefined ||
            titleNumber === undefined ||
            !imageCID ||
            !coFoCID
        ) {
          toast.error("Missing field(s)");
          return;
        }

        // Connection checks
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
          const assessedValueInWei = parseEther(assessedValuePerPlot.toString());

          console.log("Registering land with params:", {
            numberOfPlots,
            state,
            lga,
            city,
            assessedValuePerPlot: assessedValueInWei,
            titleNumber,
            imageCID,
            coFoCID
          });

          // Register the land
          const estimatedGas = await contract.registerLand.estimateGas(
              numberOfPlots,
              state,
              lga,
              city,
              assessedValueInWei,
              titleNumber,
              imageCID,
              coFoCID
          );

          const tx = await contract.registerLand(
              numberOfPlots,
              state,
              lga,
              city,
              assessedValueInWei,
              titleNumber,
              imageCID,
              coFoCID,
              {
                gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
              }
          );

          toast.info("Transaction submitted, waiting for confirmation...");
          const receipt = await tx.wait();

          if (receipt.status === 1) {
            toast.success("Land registered successfully");
            navigate("/lands/user");
            return;
          }

          toast.error("Land registration failed");

        } catch (error) {
          console.error("Error while registering land: ", error);
          toast.error("Land registration failed: " + (error instanceof Error ? error.message : "Unknown error"));
        }
      },
      [address, chainId, contract, navigate]
  );
};

export default useRegisterLand;
