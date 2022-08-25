import BigNumber from 'bignumber.js'
import { 
  BlockEvent, 
  Finding, 
  HandleBlock, 
  FindingSeverity, 
  FindingType,
  getEthersProvider,
  ethers
} from 'forta-agent'

// fill these in with your desired values
export const ACCOUNT = ""
export const MIN_BALANCE = "500000000000000000" // 0.5 eth

const ethersProvider = getEthersProvider()
let lastAlertTime: Date | undefined;


function provideHandleBlock(ethersProvider: ethers.providers.JsonRpcProvider): HandleBlock {
  return async function handleBlock(blockEvent: BlockEvent) {
    const findings: Finding[] = []

    // 1. Look up balance of ACCOUNT
    // 2. If balance is above threshold, reset the lastAlertTime and return early 
    // 3. If not alerted too recently, add a finding to the findings list and set lastAlertTime

    return findings
  }
}


export default {
  provideHandleBlock,
  handleBlock: provideHandleBlock(ethersProvider)
}