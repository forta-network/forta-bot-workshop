import BigNumber from 'bignumber.js'
import { 
  Finding, 
  HandleTransaction, 
  TransactionEvent, 
  FindingSeverity, 
  FindingType,
  getEthersProvider,
  ethers,
  getTransactionReceipt,
  Receipt
} from 'forta-agent'

const HIGH_GAS_THRESHOLD = "7000000"
const AAVE_V2_ADDRESS = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9"
const FLASH_LOAN_EVENT = "event FlashLoan(address indexed target, address indexed initiator, address indexed asset, uint256 amount, uint256 premium, uint16 referralCode)"
const TARGET_ADDRESS = "0xacd43e627e64355f1861cec6d3a6688b31a6f952" // Yearn Dai vault
const BALANCE_DIFF_THRESHOLD = "200000000000000000000"// 200 eth

const ethersProvider = getEthersProvider()

function provideHandleTransaction(
  ethersProvider: ethers.providers.JsonRpcProvider,
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

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(ethersProvider)
}