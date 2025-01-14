import { world } from "./world";
import { setup } from "./setup";
import { Account, RpcProvider } from "starknet";
import { BurnerManager } from "@dojoengine/create-burner";
import { SyncManager } from "@dojoengine/react";

export type NetworkLayer = Awaited<ReturnType<typeof createNetworkLayer>>;

export const createNetworkLayer = async () => {
    const { components, systemCalls, network } = await setup();

    const rpcProvider = new RpcProvider({
        nodeUrl: import.meta.env.VITE_PUBLIC_NODE_URL!,
    });

    const masterAccount = new Account(
        rpcProvider,
        import.meta.env.VITE_PUBLIC_MASTER_ADDRESS!,
        import.meta.env.VITE_PUBLIC_MASTER_PRIVATE_KEY!
    );

    const burnerManager = new BurnerManager({
        masterAccount,
        accountClassHash: import.meta.env.VITE_PUBLIC_ACCOUNT_CLASS_HASH!,
        rpcProvider,
    });

    // TODO: Currently if you change wallets in the UI, phaser will not update.
    burnerManager.init();

    if (burnerManager.account) {
        // sync manager to active address
        new SyncManager(network.torii_client, [
            {
                model: network.contractComponents.Position,
                keys: [burnerManager.account?.address],
            },
            {
                model: network.contractComponents.Moves as any,
                keys: [burnerManager.account?.address],
            },
        ]);
    }

    return {
        world,
        components,
        systemCalls,
        network,
        account: burnerManager.account as Account,
        burnerManager,
    };
};
