![image](https://user-images.githubusercontent.com/2632384/162202240-f42f201a-7871-442d-af51-9e5e8b5ddbe4.png)

# Exercise 2: Build a Bot that Detects a Minimum Account Balance

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

### Change directory to **activity-1-large-token-transfers**
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

### Test using a Past Transaction

The SDK includes a helpful utility that lets one replay previous blocks.

Test your bot against a known transaction using `npm run block {block-number}` command

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

