![image](https://user-images.githubusercontent.com/2632384/162202240-f42f201a-7871-442d-af51-9e5e8b5ddbe4.png)

# Exercise 3: Bot that detects a Flash Loan resulting in losses

In this activity, we'll create a bot that detects when a transaction includes a flash loan AND results in losses for a vault protocol.  For this example, we'll use the Yearn Dai Vault as the vault to monitor.

## Overview
- [1. Setup Environment](#1-setup-environment)
- [2. Add Logic to Bot Code](#2-add-logic-to-bot-code)
- [3. Test the Bot](#3-test-the-bot)

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

Inside of [src/agent.ts](https://github.com/forta-network/forta-bot-workshop/blob/main/activity-3-flash-loan-with-losses/src/agent.ts#L32), there is a handler called `provideHandleTransaction`.  

This handler is invoked for **EVERY** transaction on the network.  We'll be adding our detection logic here. Each time this handler is called, it receives a txEvent including details about the current transaction.

For performance, it makes sense to return early as soon as possible if we know this transaction is not relevant.  We can do this by making inexpensive checks for address & event involvement before more expensive checks, like balance lookups.

This is what it looks like before we add anything
```typescript
function provideHandleTransaction(
  ethersProvider: ethers.providers.JsonRpcProvider,
  vaultFactory: VaultFactory,
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    // report finding if detected a flash loan attack on the vault address
    const findings: Finding[] = []

    // 1. Check for Vault Address and AAVE involvement
    // 2. Check for Flash Loan
    // 3. Check for Loss of Funds for Vault Address
    // 4. Return finding if all 3 occured

    return findings
  }
}
```
## Add Logic: Check for Target Address and AAVE involvement

If the vault address or AAVE are not involved, return early.

```javascript
    // if aave not involved, skip transaction
    if (!txEvent.addresses[AAVE_V2_ADDRESS]) return findings

    // if target address not involved, skip transaction
    if (!txEvent.addresses[VAULT_ADDRESS]) return findings
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
    // look up balance for previous block and current block
    const vault = vaultFactory(VAULT_ADDRESS, vaultABI, ethersProvider);
    const currentBlockBalance = await vault.balance({ blockTag: txEvent.blockNumber });
    const prevBlockBalance = await vault.balance({ blockTag: txEvent.blockNumber - 1 })

    // if difference does not exceed threshold, return early
    const delta = currentBlockBalance.sub(prevBlockBalance);
    if (!delta.lte(BALANCE_DIFF_THRESHOLD)) return findings
```

## Add Logic: Return finding if all 3 occured

If the code reaches this far, it means we should add a finding to the list so that it will be returned.

```typescript
    findings.push(
      Finding.fromObject({
        name: "Flash Loan with Loss",
        description: `Flash Loan with loss of ${delta.toString()} detected for ${VAULT_ADDRESS}`,
        alertId: "FORTA-5",
        protocol: "aave",
        type: FindingType.Suspicious,
        severity: FindingSeverity.High,
        metadata: {
          protocolAddress: VAULT_ADDRESS,
          balanceDiff: delta.toString(),
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

> flash-loan-with-losses@0.0.1 test
> jest

 PASS  src/agent.spec.ts
  flash loan agent
    handleTransaction
      ✓ returns empty findings if aave not involved (2 ms)
      ✓ returns a finding if a flash loan attack is detected (2 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        2.673 s, estimated 3 s
Ran all test suites.
```

### Test using a Past Transaction

This transaction demonstrates the [Feb 2021 Yearn Vault attack](https://github.com/yearn/yearn-security/blob/master/disclosures/2021-02-04.md):
```
0x59faab5a1911618064f1ffa1e4649d85c99cfd9f0d64dcebbc1af7d7630da98b
```

We can test our bot against that transaction.  


**For this test, you must populate a `~/.forta/forta.config.json` file with a `jsonRpcUrl` pointing to an archive node (like Alchemy).**
```
{
  "jsonRpcUrl": "https://eth-mainnet.g.alchemy.com/v2/your-key-here",
}
```

Example Output:
```
$ npm run tx 0x59faab5a1911618064f1ffa1e4649d85c99cfd9f0d64dcebbc1af7d7630da98b

> flash-loan-with-losses@0.0.1 tx
> npm run build && forta-agent run --tx "0x59faab5a1911618064f1ffa1e4649d85c99cfd9f0d64dcebbc1af7d7630da98b"


> flash-loan-with-losses@0.0.1 build
> tsc

1 findings for transaction 0x59faab5a1911618064f1ffa1e4649d85c99cfd9f0d64dcebbc1af7d7630da98b {
  "name": "Flash Loan with Loss",
  "description": "Flash Loan with loss of -1146528622023666900927098 detected for 0xacd43e627e64355f1861cec6d3a6688b31a6f952",
  "alertId": "FORTA-5",
  "protocol": "aave",
  "severity": "High",
  "type": "Suspicious",
  "metadata": {
    "protocolAddress": "0xacd43e627e64355f1861cec6d3a6688b31a6f952",
    "balanceDiff": "-1146528622023666900927098",
    "loans": "[{\"eventFragment\":{\"name\":\"FlashLoan\",\"anonymous\":false,\"inputs\":[{\"name\":\"target\",\"type\":\"address\",\"indexed\":true,\"components\":null,\"arrayLength\":null,\"arrayChildren\":null,\"baseType\":\"address\",\"_isParamType\":true},{\"name\":\"initiator\",\"type\":\"address\",\"indexed\":true,\"components\":null,\"arrayLength\":null,\"arrayChildren\":null,\"baseType\":\"address\",\"_isParamType\":true},{\"name\":\"asset\",\"type\":\"address\",\"indexed\":true,\"components\":null,\"arrayLength\":null,\"arrayChildren\":null,\"baseType\":\"address\",\"_isParamType\":true},{\"name\":\"amount\",\"type\":\"uint256\",\"indexed\":null,\"components\":null,\"arrayLength\":null,\"arrayChildren\":null,\"baseType\":\"uint256\",\"_isParamType\":true},{\"name\":\"premium\",\"type\":\"uint256\",\"indexed\":null,\"components\":null,\"arrayLength\":null,\"arrayChildren\":null,\"baseType\":\"uint256\",\"_isParamType\":true},{\"name\":\"referralCode\",\"type\":\"uint16\",\"indexed\":null,\"components\":null,\"arrayLength\":null,\"arrayChildren\":null,\"baseType\":\"uint16\",\"_isParamType\":true}],\"type\":\"event\",\"_isFragment\":true},\"name\":\"FlashLoan\",\"signature\":\"FlashLoan(address,address,address,uint256,uint256,uint16)\",\"topic\":\"0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac\",\"args\":[\"0x62494b3ed9663334E57f23532155eA0575C487C5\",\"0x62494b3ed9663334E57f23532155eA0575C487C5\",\"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\",{\"type\":\"BigNumber\",\"hex\":\"0x177b3d550221be893e89\"},{\"type\":\"BigNumber\",\"hex\":\"0x0568fd5659c8b23f91\"},0],\"address\":\"0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9\",\"logIndex\":264}]"
  },
  "addresses": []
}
```

### Test on Live Data

Run this on live data where the bot will continuously process new blocks by using the `npm start`.

**If you see an alert, this means the bot possibly detected an actual attack**

Expected Output:
```bash
$ npm start

> flash-loan-with-losses@0.0.1 start
> npm run start:dev


> flash-loan-with-losses@0.0.1 start:dev
> nodemon --watch src --watch forta.config.json -e js,ts,json  --exec "npm run build && forta-agent run"

[nodemon] 2.0.19
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): src/**/* forta.config.json
[nodemon] watching extensions: js,ts,json
[nodemon] starting `npm run build && forta-agent run`

> flash-loan-with-losses@0.0.1 build
> tsc

listening for blockchain data...
fetching block 15412740...
0 findings for transaction 0x5788bd6d0c00f83b90aa6e5f98e1cd4eb5cd1c4900885ea4e2ad9a7b96fe0e5a 
0 findings for transaction 0x20120e3d3fd4a5122dd5a98bbaa10217b8e85ac477a0d518dc571af5d07b1e50 
0 findings for transaction 0xa3b33f059da329439587694d6833934b6de132d376470f72d68fbf32abe24e6f 
0 findings for transaction 0x20639c0201055a435969416e24ec64b8b1ec904f02284199123b198d7bcf0d7e 
0 findings for transaction 0x5c88eb3356ef7c6bdaf132ece0e1ebfb52b2b8fe6cf1b568d24832dd8187e9fb 
0 findings for transaction 0x2e80ee99d285e5246fb33fc2e2d338feeb347c97f8dd39b682f0355f699b93dc 
0 findings for transaction 0x9978449a9dfef1f6a6a4bf7934f329439752c107f16c1d06d7f657ed342942be 
0 findings for transaction 0x80ccfa662e82ee24e3c77fe6d02fdb26afef494e86e271cb805e9cac4026aaee 
0 findings for transaction 0xa9c9c99980ec803682e5a0a6460988bc4bd9cd8e1b5b7bac92fbc9cc78ed7030 
0 findings for transaction 0x1966db11de253881930c56ee7b6aa8663a12237883ca2396c28d052be2adce84 
...
```

To stop the process, type `CTRL-C`.


