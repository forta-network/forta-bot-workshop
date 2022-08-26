![image](https://user-images.githubusercontent.com/2632384/162202240-f42f201a-7871-442d-af51-9e5e8b5ddbe4.png)

# Forta Bot Workshop

This repo contains activities that demonstrate the workflow for developing a Forta Detection Bot.

# Resources

For more information, please see our Development Resources
- [Quick Start](https://docs.forta.network/en/latest/quickstart/)
- [Documentation](https://docs.forta.network)
- [Bot Examples](https://github.com/forta-network/forta-bot-examples)
- [Forta Explorer](https://explorer.forta.network)
- [Forta App](https://app.forta.network)

# Minimal Initial Setup

To experience these exercises, you'll need Node.js v12+ and an Archive Node (e.g., Alchemy)

Create a forta directoy 
```
$ mkdir ~/.forta
```

Create a file at `~/.forta/forta.config.json` with a `jsonRpcUrl` pointing to an archive node (e.g., Alchemy free tier)
```
{
  "jsonRpcUrl": "https://eth-mainnet.g.alchemy.com/v2/..."
}
```

This will let you test bots on historical blocks.  Otherwise you'll only be able to run for newer blocks.


# Activities

- [Exercise 1: Bot that detects large USDC transfers](activity-1-large-token-transfers)
- [Exercise 2: Bot that detects when a balance is too low](activity-2-minimum-account-balance)
- [Exercise 3: Bot that detects a Flash Loan resulting in losses](activity-3-flash-loan-with-losses)
