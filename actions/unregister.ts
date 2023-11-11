import { ActionFn, BlockEvent, Context, Event } from "@tenderly/actions";

import { ethers } from "ethers";
import { abi } from "./artifacts/DCAOrder.json"
import { Registry } from "./registry";
import { ChainContext } from "./watch";

export const removeContract: ActionFn = async (
    context: Context,
    event: Event
) => {
    const blockEvent = event as BlockEvent;
    const registry = await Registry.load(context, blockEvent.network);
    const chainContext = await ChainContext.create(context, blockEvent.network);
  
    const contractsToDelete: string[] = []
  
    for (const contract_address of registry.contracts) {
        console.log(`Checking ${contract_address}`);
        const contract = new ethers.Contract(
            contract_address,
            abi,
            chainContext.provider
        );
        try {
            const [isCancelled, endTime]: [string, string] = await Promise.allSettled([contract.cancelled(), contract.endTime()]).then(([cancelledResult, endTimeResult])=> {
                if (cancelledResult.status === "rejected" || endTimeResult.status === "rejected") {
                throw "Rejected result"
                }

                return [cancelledResult.value, endTimeResult.value]
            })

            // Give it a few more 15 minutes so it reproduces the last order
            const _15_MINUTES = 900
            const contractEndTimeIsPast = (parseInt(endTime, 10) + _15_MINUTES) * 1000 < new Date().getTime()
        
            if (Boolean(isCancelled) || contractEndTimeIsPast) {
                console.log(`Invalid contract: isCancelled (${isCancelled}) or endTime (${endTime}) not valid `)
                contractsToDelete.push(contract_address)
            }
        } catch (e: any) {
            console.log(`Not tradeable (${e})`);
        }
    }

    for (const contract_address of contractsToDelete) {
        const contractIndex = registry.contracts.findIndex((existing: string) => existing == contract_address);
        if (contractIndex >= 0) {
          registry.contracts.splice(contractIndex, 1);
          console.log(`Removing contract ${contract_address}`);
        }
    }

    if(contractsToDelete.length > 0) {
        registry.write();
    }
}
