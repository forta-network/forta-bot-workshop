# Exercise 1: Build a Bot that Detects Large USDC Transfers

In this activity, we'll create a bot that detects large USDC transfers.  The bot will filter events for transactions involving USDC, then will alert when the value exceeds 10,000 USDC.

## Overview
- [1. Setup Environment](#1-setup-environment)
- [2. Add Logic to Bot Code](#2-add-logic-to-bot-code)
- [3. Test the Bot](#3-test-the-bot)
- [4. (Optional) Deploy Bot to Forta Network](#4-optional-deploy-bot-to-forta-network)
- [5. View Results from Bot](#5-view-results-from-bot)

## 1. Setup Environment

### Clone this repository
```bash
$ git clone git@github.com:forta-network/forta-bot-workshop.git
```

### Change directory to **activity-1-large-token-transfers**
```
$ cd forta-bot-workshop/activity-1-large-token-transfers
```

### Install Dependencies
```
$ npm install --save-dev
``` 

## 2. Add Logic to Bot Code

Inside of [src/agent.ts](https://github.com/forta-network/forta-bot-workshop/blob/main/activity-1-large-token-transfers/src/agent.ts#L16), there is a handler called `handleTransaction`.  

This handler is invoked for **EVERY** transaction on the network.  We'll be adding our detection logic here. 

This is what it looks like before we add anything
```typescript
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

## Add Logic: Filter the Events for USDC Transfers

The event includes a helpful `filterLog` function which will filter logs for matching events.  

Add this snippet to filter events for token transfers:
```typescript
  // filter the transaction logs for token transfer events
  const tokenTransferEvents = txEvent.filterLog(
    ERC20_TRANSFER_EVENT,
    TOKEN_ADDRESS
  );
```

## Add Logic: For each transfer event, create finding if amount > 10000

Now that we have transfer events from this transaction, we should normalize the value of the transfer to keep the code readable.  Otherwise, one would need to add six extra digits, because the USDC coin has 6 decimals

```typescript
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

## 3. Test the Bot

### Test with Unit Tests

First verify that the unit test is passing using `npm run test`

Example Output:
```bash
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

### Test using a Past Transaction

The SDK includes a helpful utility that lets one replay previous transactions by block range or by transaction hash.

Try running against `0x5475acace5f03065da719a5862282cf41807ff982dc12357d0f4b563147ee182` (30000 USDC) by using the `npm run tx {txhash}` command

Expected Output:
```bash
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

### Test on Live Data

Run this on live data where the bot will continuously process new blocks by using the `npm start`.

Expected Output:
```bash
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
0 findings for transaction 0xe764214225d033cdcf0a3cf51cad66b118a71da5468b0cb8696d50ac4c7b6f5e 
0 findings for transaction 0xa3befe590961067a47c405be81a5fb68b300fe63a3bfcc2fbba2ea111d28fb53 
0 findings for transaction 0x47f30c35817e528ebf6b4992ce551000cded245e662878fcba2d21c3b2e4c510 
...
```

To stop the process, type `CTRL-C`.

## 4. Optional: Deploy Bot to Forta Network

You've created a Bot that runs locally 🚀.  

To deploy your bot to the Forta Network, follow the instructions here: 
https://docs.forta.network/en/latest/deploying-app/

This step pushes your image to a decentralized docker registry, signs a manifest for your bot, and registers the bot on our Bot Registry on Polygon.  The transaction on Polygon requires MATIC to pay gas for the transaction.  After it's registered, it will run on multiple nodes on the Forta Network.

## 5. View Results from Bot

I've already deployed this bot so we can see real alerts!

See Alerts Here!
https://explorer.forta.network/bot/0x7ea5d73c42397473ec87b2022df9c574313d2bfb717602c013cc04df3d122939

Example Alert:
![image](https://user-images.githubusercontent.com/6051744/186253891-6d43f0c3-ae64-42d0-8321-351711db62d1.png)

