import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const tokenAddress = "0x30D2B43768f9d2f66eCCed8fE565690faDa52862";
const nft_address = "0x0A0d4CD0dc9ab209D3c46861d7F4D179Ede1738C";

const DelarContractModule = buildModule("DelarContractModule", (m) => {

    const DelarContract = m.contract("DelarContract", [tokenAddress, nft_address]);

    return { DelarContract };
});

export default DelarContractModule;
