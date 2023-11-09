import {
    Context,
    Storage,
  } from "@tenderly/actions";

  export const storageKey = (network: string): string => {
    return `CONDITIONAL_ORDER_REGISTRY_${network}`;
  };
  
  export class Registry {
    contracts: string[];
    storage: Storage;
    network: string;
  
    constructor(contracts: string[], storage: Storage, network: string) {
      this.contracts = contracts;
      this.storage = storage;
      this.network = network;
    }
  
    public static async load(
      context: Context,
      network: string
    ): Promise<Registry> {
      const registry = await context.storage.getJson(storageKey(network));
      return new Registry(registry.contracts || [], context.storage, network);
    }
  
    public async write() {
      await this.storage.putJson(storageKey(this.network), {
        contracts: this.contracts,
      });
    }
  }