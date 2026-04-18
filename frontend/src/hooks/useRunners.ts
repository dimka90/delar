/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { jsonRpcProvider } from "../constants/provider";
import { Eip1193Provider } from "ethers";
import { useAppKitNetwork } from "@reown/appkit/react";

const useRunners = () => {
    const [signer, setSigner] = useState<any | null>(null);
    const { walletProvider }  = useAppKitProvider<Eip1193Provider>("eip155");
    const { isConnected, address } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();

    const provider = useMemo(
        () => (walletProvider ? new BrowserProvider(walletProvider) : null),
        [walletProvider]
    );

    useEffect(() => {
        if (!provider || !isConnected) {
            setSigner(null);
            return;
        }

        let isMounted = true;
        setSigner(null);

        provider.getSigner().then((newSigner) => {
            if (!isMounted) return;
            setSigner(newSigner);
        }).catch(() => {
            if (!isMounted) return;
            setSigner(null);
        });

        return () => {
            isMounted = false;
        };
    }, [address, chainId, isConnected, provider]);
    return { provider, signer, readOnlyProvider: jsonRpcProvider };
};

export default useRunners;
