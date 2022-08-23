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

Try running against `0x5475acace5f03065da719a5862282cf41807ff982dc12357d0f4b563147ee182` (30000 USDC) as follows
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
