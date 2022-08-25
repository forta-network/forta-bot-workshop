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
    if("" == ACCOUNT) {
      throw new Error("please set ACCOUNT to your desired account")
    }
    const findings: Finding[] = []

    // look up balance of ACCOUNT

    // if balance is above threshold, return early and reset the lastAlertTime

    // if not alerted too recently, add a finding to the findings list and set lastAlertTime

    return findings
  }
}


export default {
  provideHandleBlock,
  handleBlock: provideHandleBlock(ethersProvider)
}