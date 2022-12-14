import { 
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  createTransactionEvent
} from "forta-agent"
import { BigNumber } from 'ethers'
import agent from "./agent"

describe("flash loan agent", () => {
  let handleTransaction: HandleTransaction;
  const mockEthersProvider = {
    getBalance: jest.fn()
  } as any
  const mockVault = {
    balance: jest.fn()
  } as any
  const vaultFactory = () => {
    return mockVault;
  }

  const createTxEvent = ({ addresses, logs, blockNumber }: any) => createTransactionEvent({
    transaction: {} as any,
    logs,
    contractAddress: null,
    block: { number: blockNumber } as any,
    addresses
  })

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(mockEthersProvider, vaultFactory)
  })

  describe("handleTransaction", () => {
    it("returns empty findings if aave not involved", async () => {
      const txEvent = createTxEvent({ addresses: {} })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding if a flash loan attack is detected", async () => {
      const flashLoanTopic = "0x631042c832b07452973831137f2d73e395028b44b250dedc5abb0ee766e168ac"
      const flashLoanEvent = {
        topics: [flashLoanTopic]
      }
      const protocolAddress = "0xacd43e627e64355f1861cec6d3a6688b31a6f952"
      const blockNumber = 100
      const txEvent = createTxEvent({ 
        addresses: {
          "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9": true,
          [protocolAddress]: true
        },
        blockNumber
      })
      txEvent.filterLog = jest.fn().mockReturnValue([flashLoanEvent])
      const currentBalance = "1"
      const previousBalance = "200000000000000000001"
      const balanceDiff = "-200000000000000000000"
      mockVault.balance.mockReturnValueOnce(BigNumber.from(currentBalance))
      mockVault.balance.mockReturnValueOnce(BigNumber.from(previousBalance))

      const findings = await handleTransaction(txEvent)

      expect(mockVault.balance).toHaveBeenCalledTimes(2)
      expect(mockVault.balance).toHaveBeenNthCalledWith(1, { "blockTag": blockNumber })
      expect(mockVault.balance).toHaveBeenNthCalledWith(2, { "blockTag": blockNumber-1 })
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Flash Loan with Loss",
          description: `Flash Loan with loss of ${balanceDiff} detected for ${protocolAddress}`,
          alertId: "FORTA-5",
          protocol: "aave",
          type: FindingType.Suspicious,
          severity: FindingSeverity.High,
          metadata: {
            protocolAddress,
            balanceDiff,
            loans: JSON.stringify([flashLoanEvent])
          },
        })
      ])
    })
  })
})