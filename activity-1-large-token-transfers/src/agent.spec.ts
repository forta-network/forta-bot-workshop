import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  ethers,
} from "forta-agent";
import agent, {
  ERC20_TRANSFER_EVENT,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
} from "./agent";

describe("high token transfer agent", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no token transfers", async () => {
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        ERC20_TRANSFER_EVENT,
        TOKEN_ADDRESS
      );
    });

    it("returns a finding if there is a token transfer over 10,000", async () => {
      const mocktokenTransferEvent = {
        args: {
          from: "0xabc",
          to: "0xdef",
          value: ethers.BigNumber.from("20000000000"), //20k with 6 decimals
        },
      };
      mockTxEvent.filterLog = jest
        .fn()
        .mockReturnValue([mocktokenTransferEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const normalizedValue = mocktokenTransferEvent.args.value.div(
        10 ** TOKEN_DECIMALS
      );
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High USDC Transfer",
          description: `High amount of USDC transferred: ${normalizedValue}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            to: mocktokenTransferEvent.args.to,
            from: mocktokenTransferEvent.args.from,
          },
        }),
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        ERC20_TRANSFER_EVENT,
        TOKEN_ADDRESS
      );
    });
  });
});
