import Decimal from 'decimal.js'
import React from 'react'
import { MarketOption } from '@play-money/database'
import { CurrencyDisplay } from '@play-money/finance/components/CurrencyDisplay'
import { MarketOptionPositionAsNumbers, NetBalanceAsNumbers } from '@play-money/finance/lib/getBalances'
import { Tooltip, TooltipContent, TooltipTrigger } from '@play-money/ui/tooltip'

const transactionLabels: Record<string, string> = {
  TRADE_BUY: 'Bought positions',
  TRADE_SELL: 'Sold positions',
  TRADE_WIN: 'Positions won',
  TRADE_LOSS: 'Positions lost',

  LIQUIDITY_INITIALIZE: 'Market creation',
  CREATOR_TRADER_BONUS: 'Market trader bonus',

  LIQUIDITY_DEPOSIT: 'Liquidity deposited',
  LIQUIDITY_WITHDRAWAL: 'Liquidity withdrawn',
  LIQUIDITY_RETURNED: 'Liquidity returned',
  LIQUIDITY_VOLUME_BONUS: 'Liquidity volume bonus',
}

const sumTransactionSubtotals = (balance: NetBalanceAsNumbers | undefined, transactionTypes: string[]): number => {
  if (!balance || !balance.subtotals) return 0
  return transactionTypes.reduce((sum, type) => sum + (balance.subtotals[type] || 0), 0)
}

export function MarketBalanceBreakdown({
  balance,
  positions,
  options,
}: {
  balance?: NetBalanceAsNumbers
  positions: Array<MarketOptionPositionAsNumbers>
  options: Array<MarketOption>
}) {
  const traderTransactions = ['TRADE_BUY', 'TRADE_SELL', 'TRADE_WIN', 'TRADE_LOSS']
  const creatorTransactions = ['CREATOR_TRADER_BONUS']
  const promoterTransactions = [
    'LIQUIDITY_INITIALIZE',
    'LIQUIDITY_DEPOSIT',
    'LIQUIDITY_WITHDRAWAL',
    'LIQUIDITY_RETURNED',
    'LIQUIDITY_VOLUME_BONUS',
  ]

  const positionsSum = positions.reduce((sum, position) => sum + position.value, 0)

  const traderTransactionsSum = sumTransactionSubtotals(balance, traderTransactions) + positionsSum
  const creatorTransactionsSum = sumTransactionSubtotals(balance, creatorTransactions)
  const promoterTransactionsSum = sumTransactionSubtotals(balance, promoterTransactions)

  return (
    <div className="divide-y font-mono text-xs *:py-2 first:*:pt-0 last:*:pb-0">
      {traderTransactionsSum ? (
        <div>
          {positions.map((position) => {
            const option = options.find((option) => option.id === position.optionId)!
            const value = new Decimal(position.value).toDecimalPlaces(4)
            const cost = new Decimal(position.cost).toDecimalPlaces(4)
            const change = value.sub(cost).div(cost).times(100).round().toNumber()
            const changeLabel = `(${change > 0 ? '+' : ''}${change}%)`

            return value.toNumber() ? (
              <Tooltip key={position.optionId}>
                <TooltipTrigger className="flex w-full justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex gap-1">
                    <div className="mt-1 size-2 flex-shrink-0 rounded-md" style={{ backgroundColor: option.color }} />
                    <span className="line-clamp-2 font-mono">{option.name}</span>
                  </div>
                  <div className="flex gap-2">
                    {change ? (
                      <span className={change > 0 ? 'text-lime-500' : 'text-red-400'}>{changeLabel}</span>
                    ) : null}
                    <CurrencyDisplay value={position.value} />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm" align="start">
                  <div>{option.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Cost: {new Decimal(position.cost).toDecimalPlaces(4).toString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quantity: {new Decimal(position.quantity).toDecimalPlaces(4).toString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Value: {new Decimal(position.value).toDecimalPlaces(4).toString()}
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : null
          })}

          {traderTransactions.map((type) =>
            balance?.subtotals[type] ? (
              <div className="flex justify-between text-muted-foreground" key={type}>
                <span>{transactionLabels[type]}</span>
                <CurrencyDisplay value={balance.subtotals[type]} />
              </div>
            ) : null
          )}

          <div className="flex justify-between font-semibold text-muted-foreground">
            <span>Trader subtotal</span>
            <CurrencyDisplay value={traderTransactionsSum} />
          </div>
        </div>
      ) : null}

      {creatorTransactionsSum ? (
        <div>
          {creatorTransactions.map((type) =>
            balance?.subtotals[type] ? (
              <div className="flex justify-between text-muted-foreground" key={type}>
                <span>{transactionLabels[type]}</span>
                <CurrencyDisplay value={balance.subtotals[type]} />
              </div>
            ) : null
          )}

          <div className="flex justify-between font-semibold text-muted-foreground">
            <span>Creator subtotal</span>
            <CurrencyDisplay value={creatorTransactionsSum} />
          </div>
        </div>
      ) : null}

      {promoterTransactionsSum ? (
        <div>
          {promoterTransactions.map((type) =>
            balance?.subtotals[type] ? (
              <div className="flex justify-between text-muted-foreground" key={type}>
                <span>{transactionLabels[type]}</span>
                <CurrencyDisplay value={balance.subtotals[type]} />
              </div>
            ) : null
          )}

          <div className="flex justify-between font-semibold text-muted-foreground">
            <span>Promoter subtotal</span>
            <CurrencyDisplay value={promoterTransactionsSum} />
          </div>
        </div>
      ) : null}

      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <CurrencyDisplay value={traderTransactionsSum + creatorTransactionsSum + promoterTransactionsSum} />
      </div>
    </div>
  )
}
