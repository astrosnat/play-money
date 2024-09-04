'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import _ from 'lodash'
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { createMarketSell, getMarketQuote } from '@play-money/api-helpers/client'
import { MarketOption } from '@play-money/database'
import { MarketOptionPositionAsNumbers } from '@play-money/finance/lib/getBalances'
import { Button } from '@play-money/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { Slider } from '@play-money/ui/slider'
import { toast } from '@play-money/ui/use-toast'
import { QuoteItem, calculateReturnPercentage, formatCurrency, formatPercentage } from './MarketBuyForm'

const FormSchema = z.object({
  amount: z.coerce.number().min(1, { message: 'Amount must be greater than zero' }),
})

type FormData = z.infer<typeof FormSchema>

export function MarketSellForm({
  marketId,
  option,
  position,
  onComplete,
}: {
  marketId: string
  option: MarketOption
  position?: MarketOptionPositionAsNumbers
  onComplete?: () => void
}) {
  const [max, setMax] = useState(position?.quantity)
  const [quote, setQuote] = useState<{ newProbability: number; potentialReturn: number } | null>(null)
  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: '' as unknown as number, // Fix uncontrolled component error
    },
  })

  useEffect(() => {
    if (position?.quantity) {
      setMax(position.quantity)
      form.setValue('amount', Math.round(position.quantity / 2))
    } else {
      form.setValue('amount', 0)
    }
  }, [option.id, position])

  const onSubmit = async (data: FormData) => {
    try {
      await createMarketSell({ marketId: marketId, optionId: option.id, amount: data.amount })
      toast({ title: 'Shares sold successfully' })
      form.reset({ amount: 0 })
      setQuote(null)
      onComplete?.()
    } catch (error: any) {
      console.error('Failed to place bet:', error)
      toast({
        title: 'There was an issue selling shares',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      })
    }
  }

  const fetchQuote = async (amount: number, optionId: string) => {
    try {
      const data = await getMarketQuote({ marketId, optionId, amount, isBuy: false })
      setQuote(data)
    } catch (error) {
      console.error('Failed to fetch quote:', error)
    }
  }

  useEffect(() => {
    const amount = form?.getValues('amount')
    if (amount && option.id) {
      fetchQuote(amount, option.id)
    }

    const subscription = form.watch(({ amount }) => {
      if (amount) {
        fetchQuote(amount, option.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, option.id])

  const proportionateCost = (form.getValues('amount') * (position?.cost || 0)) / (position?.quantity || 0)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center justify-between">Amount</FormLabel>
              <FormControl>
                <div>
                  <Slider
                    className="my-4"
                    min={1}
                    max={max}
                    value={[field.value]}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(e.currentTarget.valueAsNumber)}
                      className="h-9 font-mono"
                    />

                    <Button size="sm" type="button" variant="secondary" onClick={() => field.onChange(max)}>
                      MAX
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full truncate" loading={form.formState.isSubmitting}>
          Sell {_.truncate(option.name, { length: 20 })}
        </Button>

        <ul className="grid gap-1 text-sm">
          <QuoteItem
            label="Potential return"
            value={quote?.potentialReturn}
            formatter={formatCurrency}
            percent={calculateReturnPercentage(quote?.potentialReturn, proportionateCost)}
          />
          <QuoteItem label="New probability" value={quote?.newProbability} formatter={formatPercentage} />
        </ul>
      </form>
    </Form>
  )
}
