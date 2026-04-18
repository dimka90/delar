import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DelarTokenModule = buildModule("DelarTokenModule", (m) => {

    const erc20 = m.contract("DelarToken");

    return { erc20 };
});

export default DelarTokenModule;