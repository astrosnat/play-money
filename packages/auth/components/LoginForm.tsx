'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { _UserModel } from '@play-money/database'
import { Button } from '@play-money/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@play-money/ui/form'
import { Input } from '@play-money/ui/input'
import { toast } from '@play-money/ui/use-toast'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const FormSchema = _UserModel.pick({ email: true, password: true })

type FormData = z.infer<typeof FormSchema>

export function LoginForm({ csrf }: { csrf: string }) {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    const { email, password } = data

    try {
      const response = await signIn('credentials', { email, password, redirect: false })

      console.log(response)
      if (response?.error) {
        throw new Error()
      }

      router.push('/')
    } catch (error: any) {
      console.error('Login Failed:', error)
      toast({ title: 'Login Failed', description: error.message })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel>Password</FormLabel>
                <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <FormControl>
                <Input placeholder="Password" {...field} type="password" />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Login
        </Button>
      </form>
    </Form>
  )
}