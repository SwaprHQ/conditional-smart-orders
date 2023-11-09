import {
  ActionFn,
  Context,
  Event,
  TransactionEvent,
} from "@tenderly/actions";

import { ethers } from "ethers";
import { abi } from "./artifacts/ConditionalOrder.json";
import { Registry } from "./registry";

export const addContract: ActionFn = async (context: Context, event: Event) => {
  const transactionEvent = event as TransactionEvent;
  const iface = new ethers.utils.Interface(abi);

  const registry = await Registry.load(context, transactionEvent.network);
  console.log(`Current registry: ${JSON.stringify(registry.contracts)}`);

  transactionEvent.logs.forEach((log) => {
    if (log.topics[0] === iface.getEventTopic("ConditionalOrderCreated")) {
      const contract = iface.decodeEventLog(
        "ConditionalOrderCreated",
        log.data,
        log.topics
      )[0];
      if (
        registry.contracts.find((existing: string) => existing == contract) ===
        undefined
      ) {
        registry.contracts.push(contract);
        console.log(`adding contract ${contract}`);
      }
    }
  });
  console.log(`Updated registry: ${JSON.stringify(registry.contracts)}`);
  await registry.write();
};
