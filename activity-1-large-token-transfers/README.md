# Large USDC Transfer Agent

## Description

In this activity, we'll create a bot that detects large USDC transfers 

## Setup

### Clone this repository
```bash
$ git clone git@github.com:forta-network/forta-bot-workshop.git
```

### Change directory to **activity-1-large-token-transfers**
```
$ cd forta-bot-workshop/activity-1-large-token-transfers
```

### Install dependencies
```
$ npm install --save-dev
``` 

## Add Logic

Inside of src/agent.ts, there is a handler called `handleTransaction`.  This handler is invoked for **EVERY** transaction on the network.  We'll be adding our detection logic here. 

```
const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // Replace this section with code
  // 1. Filter events for USDC Transfers
  // 2. For each matching event, create a finding if amount > 10000

  return findings;
}
```

### Summary of Logic
1. Filter events for USDC Transfers
2. If the transfer is >10000, return a Finding

### Filter the Events for USDC Transfers

The event includes a helpful `filterLog` function which will filter logs for matchine events.  

Add this snippet to filter events for token transfers:
```
  // filter the transaction logs for token transfer events
  const tokenTransferEvents = txEvent.filterLog(
    ERC20_TRANSFER_EVENT,
    TOKEN_ADDRESS
  );
```

### For each matching event, create finding if amount > 10000

Now that we have transfer events from this transaction, we should normalize the value of the transfer to keep the code readable.  Otherwise, one would need to add six extra digits, because the USDC coin has 6 decimals

```
tokenTransferEvents.forEach((transferEvent) => {
  // extract transfer event arguments
  const { to, from, value } = transferEvent.args;
  // shift decimals of transfer value
  const normalizedValue = value.div(10 ** TOKEN_DECIMALS);

  // if more than 10,000 token were transferred, report it
  if (normalizedValue.gt(10000)) {
    findings.push(
      Finding.fromObject({
        name: "High USDC Transfer",
        description: `High amount of USDC transferred: ${normalizedValue}`,
        alertId: "FORTA-1",
        severity: FindingSeverity.Low,
        type: FindingType.Info,
        metadata: {
          to,
          from,
        },
      })
    );
  }
});
```

## Testing

### Unit Test

First verify that the unit test is passing
```
$ npm run test

> forta-agent-starter@0.0.1 test
> jest

 PASS  src/agent.spec.ts
  high token transfer agent
    handleTransaction
      ✓ returns empty findings if there are no token transfers (4 ms)
      ✓ returns a finding if there is a token transfer over 10,000 (1 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.755 s, estimated 3 s
Ran all test suites.

```

### Detect a Past Transaction

The SDK includes a helpful utility that lets one replay previous transactions by block range or by transaction hash.

Try running against `0x5475acace5f03065da719a5862282cf41807ff982dc12357d0f4b563147ee182` (30000 USDC) by using the `npm run tx {txhash}` command

```
$ npm run tx 0x5475acace5f03065da719a5862282cf41807ff982dc12357d0f4b563147ee182

> forta-agent-starter@0.0.1 tx
> npm run build && forta-agent run --tx "0x5475acace5f03065da719a5862282cf41807ff982dc12357d0f4b563147ee182"


> forta-agent-starter@0.0.1 build
> tsc

1 findings for transaction 0x5475acace5f03065da719a5862282cf41807ff982dc12357d0f4b563147ee182 {
  "name": "High USDC Transfer",
  "description": "High amount of USDC transferred: 30000",
  "alertId": "FORTA-1",
  "protocol": "ethereum",
  "severity": "Low",
  "type": "Info",
  "metadata": {
    "to": "0xF6d625CB017d4DFeAe4963C58a8eB3840DAFE81a",
    "from": "0xA921b3fb76B85a8581691fd4A873b13c258e167b"
  },
  "addresses": []
}
```

We can see that it successfully detected this transfer.

### Run it on live data

Run this on live data where the bot will continuously process new blocks by using the `npm start`.

```
$ npm start

> forta-agent-starter@0.0.1 start
> npm run start:dev


> forta-agent-starter@0.0.1 start:dev
> nodemon --watch src --watch forta.config.json -e js,ts,json  --exec "npm run build && forta-agent run"

[nodemon] 2.0.19
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/* forta.config.json
[nodemon] watching extensions: js,ts,json
[nodemon] starting `npm run build && forta-agent run`

> forta-agent-starter@0.0.1 build
> tsc

listening for blockchain data...
fetching block 15397843...
0 findings for transaction 0xdae0a36f4d6c4ef210cd978a49bc25fcf1da1dfe557d6bec5a346093b4110290 
0 findings for transaction 0xe6769b98e008af56cd5442309ceed727882ef007e7d7d99cf4141a59d201c1b1 
1 findings for transaction 0x18320e3bbfe120ba86ad8b14da81e297852fd0b25767bdba38bfe55aa7f95896 {
  "name": "High USDC Transfer",
  "description": "High amount of USDC transferred: 14000",
  "alertId": "FORTA-1",
  "protocol": "ethereum",
  "severity": "Low",
  "type": "Info",
  "metadata": {
    "to": "0x28C6c06298d514Db089934071355E5743bf21d60",
    "from": "0x55ea2ED01eED2cDE86be4216D2Abe26088494567"
  },
  "addresses": []
}
0 findings for transaction 0x65aac6a21c0519d43e4151a95b8d7235df140163095079683bfa76196d2c47f5 
0 findings for transaction 0x92421544d520cb1bbc4a02fca51eedb89f231329e5d8cc5d5e7b1f08d5532638 
1 findings for transaction 0xd50a7230480727a77f8bab7e898f934c7356a8206efe1bcb2486b2b8074a356b {
  "name": "High USDC Transfer",
  "description": "High amount of USDC transferred: 2399998",
  "alertId": "FORTA-1",
  "protocol": "ethereum",
  "severity": "Low",
  "type": "Info",
  "metadata": {
    "to": "0x28C6c06298d514Db089934071355E5743bf21d60",
    "from": "0xf88c022F7EbfF09A76bf895eb5782a1d92F25Fc7"
  },
  "addresses": []
}
1 findings for transaction 0x08895767a62a1c32d21d1bc3495bbeb468374fef3f5f1a04db3482f0263c96c7 {
  "name": "High USDC Transfer",
  "description": "High amount of USDC transferred: 130795",
  "alertId": "FORTA-1",
  "protocol": "ethereum",
  "severity": "Low",
  "type": "Info",
  "metadata": {
    "to": "0x28C6c06298d514Db089934071355E5743bf21d60",
    "from": "0xD1Ba1DFe8720089cD63A85f1df203F02E6eddbf8"
  },
  "addresses": []
}
0 findings for transaction 0xe764214225d033cdcf0a3cf51cad66b118a71da5468b0cb8696d50ac4c7b6f5e 
0 findings for transaction 0xa3befe590961067a47c405be81a5fb68b300fe63a3bfcc2fbba2ea111d28fb53 
0 findings for transaction 0x47f30c35817e528ebf6b4992ce551000cded245e662878fcba2d21c3b2e4c510 
0 findings for transaction 0xcd1456be025abded9d08878c0bf2c4eed7f41a95a6ba435c62ccf377c66bdec9 
```

To stop the process, type `CTRL-C`.

## Deploy this Bot

You've created a Bot that runs locally 🚀.  

To deploy your bot to the Forta Network, follow the instructions here: 
https://docs.forta.network/en/latest/deploying-app/

This step pushes your image to a decentralized docker registry, signs a manifest for your bot, and registers the bot on our Bot Registry on Polygon.  The transaction on Polygon requires MATIC to pay gas for the transaction.  After it's registered, it will run on multiple nodes on the Forta Network.

## View Results

I've already deployed this bot so we can go ahead and see alerts!

See Alerts Here!
https://explorer.forta.network/bot/0x7ea5d73c42397473ec87b2022df9c574313d2bfb717602c013cc04df3d122939

