import BigNumber from "bignumber.js";
import { FindingSeverity } from "forta-agent";

// COMMON CONSTS

// 1 ETH
export const ETH_DECIMALS = new BigNumber(10).pow(18);

// 4 hours
export const REPORT_WINDOW_EXECUTOR_BALANCE = 60 * 60 * 4;
// 2 ETH
export const MIN_DEPOSIT_EXECUTOR_BALANCE = 2;

// ADDRESSES AND EVENTS

export const LIDO_ADDRESS = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84"; // should be lowercase
export const LIDO_DEPOSIT_EXECUTOR_ADDRESS =
  "0xf82ac5937a20dc862f9bc0668779031e06000f17";

export const SUBMITTED_EVENT =
  "event Submitted(address indexed sender, uint256 amount, address referral)";

export const LIDO_EVENTS_OF_NOTICE = [
  {
    address: LIDO_ADDRESS,
    event: "event Stopped()",
    alertId: "LIDO-DAO-STOPPED",
    name: "Lido DAO: Stopped",
    description: (args: any) => `Lido DAO contract was stopped`,
    severity: FindingSeverity.Critical,
  },
  {
    address: LIDO_ADDRESS,
    event: "event Resumed()",
    alertId: "LIDO-DAO-RESUMED",
    name: "Lido DAO: Resumed",
    description: (args: any) => `Lido DAO contract was resumed`,
    severity: FindingSeverity.High,
  },
  {
    address: LIDO_ADDRESS,
    event: "event WithdrawalCredentialsSet(bytes32 withdrawalCredentials)",
    alertId: "LIDO-DAO-WD-CREDS-SET",
    name: "Lido DAO: Withdrawal Credentials Set",
    description: (args: any) =>
      `Lido DAO withdrawal credentials was set to ${args.withdrawalCredentials}`,
    severity: FindingSeverity.Critical,
  },
  {
    address: LIDO_ADDRESS,
    event: "event ELRewardsReceived(uint256 amount)",
    alertId: "LIDO-DAO-EL-REWARDS-RECEIVED",
    name: "Lido DAO: EL rewards received",
    description: (args: any) =>
      `Rewards amount: ${new BigNumber(String(args.amount))
        .div(ETH_DECIMALS)
        .toFixed(2)} ETH`,
    severity: FindingSeverity.Info,
  },
];
