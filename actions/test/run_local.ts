import { TestBlockEvent, TestRuntime } from "@tenderly/actions-test";
import { checkForAndPlaceOrder } from "../watch";
import { Registry } from "../registry";
import { ethers } from "ethers";

const main = async () => {
  const testRuntime = new TestRuntime();
  const testEvent = new TestBlockEvent();

  const contractUnderTest = process.argv[2];
  const node_url = process.env["ETH_RPC_URL"];
  if (!node_url) {
    throw "Please specify your node url via the ETH_RPC_URL env variable";
  }

  // The web3 actions fetches the node url and computes the API based on the current chain id
  const provider = new ethers.providers.JsonRpcProvider(node_url);
  const { chainId } = await provider.getNetwork();
  testEvent.network = chainId.toString();
  await testRuntime.context.secrets.put(`NODE_URL_${chainId}`, node_url);

  // Register the contract that was passed in from the command line to be watched
  const registry = await Registry.load(testRuntime.context, testEvent.network);
  registry.contracts.push(contractUnderTest);
  await registry.write();

  // run action
  await testRuntime.execute(checkForAndPlaceOrder, testEvent);
};

(async () => await main())();
