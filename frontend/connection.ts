import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { sepolia, baseSepolia } from "@reown/appkit/networks";


// 1. Get projectId
const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID;

// 2. Set the networks
export const networks = [baseSepolia, sepolia];


// 3. Create a metadata object - optional
const metadata = {
    name: "My Website",
    description: "My Website description",
    url: "https://mywebsite.com", 
    icons: ["https://avatars.mywebsite.com/"],
};

// 4. Create a AppKit instance
export const appkit = createAppKit({
    adapters: [new EthersAdapter()],
    networks,
    metadata,
    projectId,
    themeMode: "dark",
    themeVariables: {
        "--w3m-accent": "#c7a276",
        "--w3m-color-mix": "#0f172a",
        "--w3m-color-mix-strength": 20,
        "--w3m-border-radius-master": "10px"
    },
    allowUnsupportedChain: false,
    allWallets: "SHOW",
    defaultNetwork: baseSepolia,
    enableEIP6963: true,

    features: {
        analytics: true,
        allWallets: true,
        email: false,
        socials: [],
    },
});
