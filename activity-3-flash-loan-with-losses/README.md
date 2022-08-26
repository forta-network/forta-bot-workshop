![image](https://user-images.githubusercontent.com/2632384/162202240-f42f201a-7871-442d-af51-9e5e8b5ddbe4.png)

# Exercise 3: Build a Bot that detects a Flash Loan resulting in losses

In this activity, we'll create a bot that detects when a transaction includes a flash loan AND results in losses for a target protocol.  For this example, we'll use the Yearn Dai Vault as the target to monitor.

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

### Change directory to **activity-3-flash-loan-with-losses**
```
$ cd forta-bot-workshop/activity-3-flash-loan-with-losses
```

### Install Dependencies
```
$ npm install --save-dev
``` 

## 2. Add Logic to Bot Code

Inside of [src/agent.ts](https://github.com/forta-network/forta-bot-workshop/blob/main/activity-2-minimum-account-balance/src/agent.ts#L20), there is a handler called `provideHandleBlock`.  

This handler is invoked for **EVERY** transaction on the network.  We'll be adding our detection logic here. Each time this handler is called, it receives a txEvent including details about the current transaction.

For performance, it makes sense to return early as soon as possible if we know this transaction is not relevant.  We can do this by making inexpensive checks for address & event involvement before more expensive checks, like balance lookups.

This is what it looks like before we add anything
```typescript
function provideHandleTransaction(
  ethersProvider: ethers.providers.JsonRpcProvider
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    // report finding if detected a flash loan attack on the target address
    const findings: Finding[] = []
  
    // 1. Check for Target Address and AAVE involvement
    // 2. Check for Flash Loan
    // 3. Check for Loss of Funds for Target Address
    // 4. Return finding if all 3 occured

    return findings
  }
}
```
## Add Logic: Check for Target Address and AAVE involvement

If the target address or AAVE are not involved, return early.

```javascript
    // if aave not involved, skip transaction
    if (!txEvent.addresses[AAVE_V2_ADDRESS]) return findings

    // if target address not involved, skip transaction
    if (!txEvent.addresses[TARGET_ADDRESS]) return findings
```
## Add Logic: Check for Flash Loan

If the address does not contain a flash loan, return early.

```javascript
    // if no flash loans occured, skip transaction
    const flashLoanEvents = txEvent.filterLog(FLASH_LOAN_EVENT)
    if (!flashLoanEvents.length) return findings
```

## Add Logic: Check for Loss of Funds for Target Address

Check for a difference in balance between the previous block and this block.  If it does not exceed a threshold, return early.

```javascript
    // if the difference in balance between the previous and this block doesn't exceed threshold, return early
    const blockNumber = txEvent.blockNumber
    const currentBalance = new BigNumber((await ethersProvider.getBalance(TARGET_ADDRESS, blockNumber)).toString())
    const previousBalance = new BigNumber((await ethersProvider.getBalance(TARGET_ADDRESS, blockNumber-1)).toString())
    const balanceDiff = previousBalance.minus(currentBalance)
    if (balanceDiff.isLessThan(BALANCE_DIFF_THRESHOLD)) return findings
```

## Add Logic: Return finding if all 3 occured

If the code reaches this far, it means we should add a finding to the list so that it will be returned.

```typescript
    findings.push(
      Finding.fromObject({
        name: "Flash Loan with Loss",
        description: `Flash Loan with loss of ${balanceDiff.toString()} detected for ${TARGET_ADDRESS}`,
        alertId: "FORTA-5",
        protocol: "aave",
        type: FindingType.Suspicious,
        severity: FindingSeverity.High,
        metadata: {
          protocolAddress: TARGET_ADDRESS,
          balanceDiff: balanceDiff.toString(),
          loans: JSON.stringify(flashLoanEvents)
        },
      }
    ))
```

## 3. Test the Bot

### Test with Unit Tests

First verify that the unit test is passing using `npm run test`

Example Output:
```
$ npm run test

> forta-agent-starter@0.0.1 test
> jest

 PASS  src/agent.spec.ts
  minimum balance agent
    handleBlock
      ✓ returns empty findings if balance is above threshold (3 ms)
      ✓ returns a finding if balance is below threshold (1 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.556 s, estimated 3 s
Ran all test suites.
```

### Test using a Past Block

The SDK includes a helpful utility that lets one replay previous blocks.

Test your bot against a known block using `npm run block {block-number}` command

Example Output:
```
$ npm run block 15411191

> forta-agent-starter@0.0.1 block
> npm run build && forta-agent run --block "15411191"


> forta-agent-starter@0.0.1 build
> tsc

fetching block 15411191...
1 findings for block 0xf2c0735c66287703e09590b40f8e4a6fabf96098e8c9d3de4abc0e88f3b5a45f {
  "name": "Balance Below Threshold",
  "description": "0x8eedf056dE8d0B0fd282Cc0d7333488Cc5B5D242 balance (3812319195977583) below (500000000000000000)",
  "alertId": "MINIMUM-BALANCE",
  "protocol": "ethereum",
  "severity": "High",
  "type": "Degraded",
  "metadata": {
    "balance": "3812319195977583"
  },
  "addresses": []
}
```

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
fetching block 15411195...
1 findings for block 0x02a15298fa1bc70a78775ebb2f92ebc2d257cd846045688ce1d295ce286f5dfb {
  "name": "Balance Below Threshold",
  "description": "0x8eedf056dE8d0B0fd282Cc0d7333488Cc5B5D242 balance (3812319195977583) below (500000000000000000)",
  "alertId": "MINIMUM-BALANCE",
  "protocol": "ethereum",
  "severity": "High",
  "type": "Degraded",
  "metadata": {
    "balance": "3812319195977583"
  },
  "addresses": []
}
...  waits 10 minutes for next due to rate logic ...
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
https://explorer.forta.network/bot/0x555feff77010a26837f3aa08fabbfec71245bbe808d95e5b756172123f0a0b3c

Example Alert:
![image](https://user-images.githubusercontent.com/6051744/186780417-15d782a3-5c48-4060-9c57-b42d09cf151e.png)

