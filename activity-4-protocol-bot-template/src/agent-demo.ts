import BigNumber from "bignumber.js";

import {
  ethers,
  BlockEvent,
  TransactionEvent,
  Finding,
  FindingType,
  FindingSeverity,
} from "forta-agent";

import LIDO_ABI from "./abi/LidoABI.json";

import {
  ETH_DECIMALS,
  LIDO_ADDRESS,
  LIDO_DEPOSIT_EXECUTOR_ADDRESS,
  LIDO_EVENTS_OF_NOTICE,
  MIN_DEPOSIT_EXECUTOR_BALANCE,
  REPORT_WINDOW_EXECUTOR_BALANCE,
  SUBMITTED_EVENT,
} from "./constants";

import { ethersProvider } from "./ethers";

let totalPooledEther = new BigNumber(0);
let lastReportedExecutorBalance = 0;

export const name = "DemoBot";

export async function initialize(
  currentBlock: number
): Promise<{ [key: string]: string }> {
  console.log(`[${name}]`);

  totalPooledEther = await getTotalPooledEther(currentBlock);

  return {
    totalPooledEther: totalPooledEther.toFixed(),
  };
}

export async function handleBlock(blockEvent: BlockEvent) {
  const findings: Finding[] = [];

  await Promise.all([
    handleTotalPooledEther(blockEvent, findings),
    handleDepositExecutorBalance(blockEvent, findings),
  ]);

  return findings;
}

async function handleTotalPooledEther(
  blockEvent: BlockEvent,
  findings: Finding[]
) {
  const newTotalPooledEther = await getTotalPooledEther(blockEvent.blockNumber);
  if (newTotalPooledEther.isGreaterThan(totalPooledEther)) {
    findings.push(
      Finding.fromObject({
        name: "Total pooled ETH increased",
        description:
          `Total pooled Ether increased from ` +
          `${totalPooledEther.div(ETH_DECIMALS).toFixed(2)} ETH to ` +
          `${newTotalPooledEther.div(ETH_DECIMALS).toFixed(2)} ETH `,
        alertId: "TOTAL-POOLED-ETH-INCREASED",
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          prevTotalPooledEther: totalPooledEther.toFixed(),
          newTotalPooledEther: newTotalPooledEther.toFixed(),
        },
      })
    );
    totalPooledEther = newTotalPooledEther;
  }
}

async function handleDepositExecutorBalance(
  blockEvent: BlockEvent,
  findings: Finding[]
) {
  const now = blockEvent.block.timestamp;
  if (lastReportedExecutorBalance + REPORT_WINDOW_EXECUTOR_BALANCE < now) {
    const executorBalanceRaw = new BigNumber(
      String(await ethersProvider.getBalance(LIDO_DEPOSIT_EXECUTOR_ADDRESS))
    );
    const executorBalance = executorBalanceRaw.div(ETH_DECIMALS).toNumber();
    if (executorBalance < MIN_DEPOSIT_EXECUTOR_BALANCE) {
      findings.push(
        Finding.fromObject({
          name: "Low deposit executor balance",
          description:
            `Balance of deposit executor is ${executorBalance.toFixed(4)}. ` +
            `This is extremely low!`,
          alertId: "LOW-DEPOSIT-EXECUTOR-BALANCE",
          severity: FindingSeverity.High,
          type: FindingType.Suspicious,
        })
      );
      lastReportedExecutorBalance = now;
    }
  }
}

export async function handleTransaction(txEvent: TransactionEvent) {
  const findings: Finding[] = [];

  handleSubmitEvent(txEvent, findings);
  handleLidoEvents(txEvent, findings);

  return findings;
}

function handleSubmitEvent(txEvent: TransactionEvent, findings: Finding[]) {
  if (LIDO_ADDRESS in txEvent.addresses) {
    const events = txEvent.filterLog(SUBMITTED_EVENT, LIDO_ADDRESS);
    events.forEach((event) => {
      const amount = new BigNumber(String(event.args.amount));
      findings.push(
        Finding.fromObject({
          name: "ETH staked",
          description:
            `${amount.div(ETH_DECIMALS).toFixed(2)} ETH staked ` +
            `by ${event.args.sender}`,
          alertId: "ETH-STAKED",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            amount: amount.toFixed(),
            sender: event.args.sender,
          },
        })
      );
    });
  }
}

function handleLidoEvents(txEvent: TransactionEvent, findings: Finding[]) {
  LIDO_EVENTS_OF_NOTICE.forEach((eventInfo) => {
    if (eventInfo.address in txEvent.addresses) {
      const events = txEvent.filterLog(eventInfo.event, eventInfo.address);
      events.forEach((event) => {
        findings.push(
          Finding.fromObject({
            name: eventInfo.name,
            description: eventInfo.description(event.args),
            alertId: eventInfo.alertId,
            severity: eventInfo.severity,
            type: FindingType.Info,
            metadata: { args: String(event.args) },
          })
        );
      });
    }
  });
}

async function getTotalPooledEther(currentBlock: number): Promise<BigNumber> {
  const lidoContract = new ethers.Contract(
    LIDO_ADDRESS,
    LIDO_ABI,
    ethersProvider
  );

  return new BigNumber(
    String(
      await lidoContract.functions.getTotalPooledEther({
        blockTag: currentBlock,
      })
    )
  );
}
