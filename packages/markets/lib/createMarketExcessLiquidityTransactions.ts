import Decimal from 'decimal.js'
import { Transaction } from '@play-money/database'
import { executeTransaction } from '@play-money/finance/lib/executeTransaction'
import { getMarketBalances } from '@play-money/finance/lib/getBalances'
import { getMarketAmmAccount } from './getMarketAmmAccount'
import { getMarketClearingAccount } from './getMarketClearingAccount'
import { getMarketLiquidity } from './getMarketLiquidity'
import { updateMarketBalances } from './updateMarketBalances'

export async function createMarketExcessLiquidityTransactions({
  initiatorId,
  marketId,
}: {
  initiatorId: string
  marketId: string
}) {
  const [ammAccount, clearingAccount] = await Promise.all([
    getMarketAmmAccount({ marketId }),
    getMarketClearingAccount({ marketId }),
  ])

  const balances = await getMarketBalances({ accountId: ammAccount.id, marketId })
  const ammOptionBalances = balances.filter(({ assetType }) => assetType === 'MARKET_OPTION')
  const amountToDistribute = Decimal.min(...ammOptionBalances.map((b) => b.total))

  const liquidity = await getMarketLiquidity(marketId)
  const transactions: Array<Promise<Transaction>> = []

  for (const [accountId, providedAmount] of Object.entries(liquidity.providers)) {
    if (providedAmount.isZero()) continue

    const proportion = providedAmount.div(liquidity.total)
    const payout = amountToDistribute.mul(proportion).toDecimalPlaces(4)

    if (payout.isZero()) continue

    const entries = [
      ...ammOptionBalances.map((balance) => {
        return {
          amount: payout,
          assetType: 'MARKET_OPTION',
          assetId: balance.assetId,
          fromAccountId: ammAccount.id,
          toAccountId: clearingAccount.id,
        } as const
      }),
      {
        amount: payout,
        assetType: 'CURRENCY',
        assetId: 'PRIMARY',
        fromAccountId: clearingAccount.id,
        toAccountId: accountId,
      } as const,
    ]

    transactions.push(
      executeTransaction({
        type: 'LIQUIDITY_RETURNED',
        entries,
        marketId,
        additionalLogic: async (txParams) => updateMarketBalances({ ...txParams, marketId }),
      })
    )
  }

  // TODO: Handle dust

  return Promise.all(transactions)
}