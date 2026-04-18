import { useMemo } from "react";
import useRunners from "./useRunners";
import { Contract } from "ethers";
import TokenABI from "../ABI/DelarToken.json";

const useTokenContract = (withSigner = false) => {
    const { readOnlyProvider, signer } = useRunners();

    return useMemo(() => {
        if (withSigner) {
            if (!signer) return null;
            return new Contract(
                import.meta.env.VITE_TOKEN_ADDRESS,
                TokenABI,
                signer
            );
        }
        return new Contract(
            import.meta.env.VITE_TOKEN_ADDRESS,
            TokenABI,
            readOnlyProvider
        );
    }, [readOnlyProvider, signer, withSigner]);
};

export default useTokenContract;