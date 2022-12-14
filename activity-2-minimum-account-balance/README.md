![image](https://user-images.githubusercontent.com/2632384/162202240-f42f201a-7871-442d-af51-9e5e8b5ddbe4.png)

# Exercise 2: Bot that detects when a balance is too low

In this activity, we'll create a bot that detects when an account balance falls below a threshold.  Simple checks like this can be a critical part of a monitoring strategy.

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

### Change directory to **activity-2-minimum-account-balance**
```
$ cd forta-bot-workshop/activity-2-minimum-account-balance
```

### Install Dependencies
```
$ npm install --save-dev
``` 

## 2. Add Logic to Bot Code

Inside of [src/agent.ts](https://github.com/forta-network/forta-bot-workshop/blob/main/activity-2-minimum-account-balance/src/agent.ts#L20), there is a handler called `provideHandleBlock`.  

This handler is invoked for **EVERY** block on the network.  We'll be adding our detection logic here. Each time this handler is called, it receives a blockEvent including details about the current block.

This is what it looks like before we add anything
```typescript
function provideHandleBlock(ethersProvider: ethers.providers.JsonRpcProvider): HandleBlock {
  return async function handleBlock(blockEvent: BlockEvent) {
    if("" == ACCOUNT) {
      throw new Error("please set ACCOUNT to your desired account")
    }
    const findings: Finding[] = []

    // 1. Look up balance of ACCOUNT
    // 2. If balance is above threshold, reset the lastAlertTime and return early 
    // 3. If not alerted too recently, add a finding to the findings list and set lastAlertTime

    return findings
  }
}

```
## Add Logic: Populate ACCOUNT with target address to inspect

Set these proprties as desired
```javascript
// fill these in with your desired values
export const ACCOUNT = "" //0xabcdef...
export const MIN_BALANCE = "500000000000000000" // 0.5 eth
```
## Add Logic: Look up Balance of ACCOUNT

```javascript
    // look up balance of the ACCOUNT
    const balance = new BigNumber((await ethersProvider.getBalance(ACCOUNT, blockEvent.blockNumber)).toString());
```

## Add Logic: If Balance is Above Threshold, return early

This quickly returns if the balance is not too low.  We reset the `lastAlertTime` so that we don't suppress the next alert due to rate limiting, even if it alerted recently.

```javascript
    // if balance is above threshold, return early (everything is good!)
    if (balance.isGreaterThanOrEqualTo(MIN_BALANCE)) {
      // reset lastAlertTime to ensure detection of the next drop in balance
      lastAlertTime = undefined
      return findings
    }
```

## Add Logic: If we didn't alert too recently, return an alert

If the code reaches this far, it means the balance is under the threshold.  

To avoid alerting for EVERY block after the balance drops, this uses a `lastAlertTime` to prevent alerting more than once per 10-minute period (600000 milliseconds).

```typescript
    // if not alerted too recently
    if(!lastAlertTime || new Date().getTime()-lastAlertTime.getTime() > 600000) {
      // we should alert
      findings.push(
        Finding.fromObject({
          name: "Balance Below Threshold",
          description: `${ACCOUNT} balance (${balance.toString()}) below (${MIN_BALANCE})`,
          alertId: "MINIMUM-BALANCE",
          severity: FindingSeverity.High,
          type: FindingType.Degraded,
          metadata: {
            balance: balance.toString()
          }
        }
      ))
      lastAlertTime = new Date()
    }
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
      ??? returns empty findings if balance is above threshold (3 ms)
      ??? returns a finding if balance is below threshold (1 ms)

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

You've created a Bot that runs locally ????.  

To deploy your bot to the Forta Network, follow the instructions here: 
https://docs.forta.network/en/latest/deploying-app/

This step pushes your image to a decentralized docker registry, signs a manifest for your bot, and registers the bot on our Bot Registry on Polygon.  The transaction on Polygon requires MATIC to pay gas for the transaction.  After it's registered, it will run on multiple nodes on the Forta Network.

## 5. View Results from Bot

I've already deployed this bot so we can see real alerts!

See Alerts Here!
https://explorer.forta.network/bot/0x555feff77010a26837f3aa08fabbfec71245bbe808d95e5b756172123f0a0b3c

Example Alert:
![image](https://user-images.githubusercontent.com/6051744/186780417-15d782a3-5c48-4060-9c57-b42d09cf151e.png)

