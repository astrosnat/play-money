import { z } from 'zod'
import { ServerErrorSchema, createSchema } from '@play-money/api-helpers'

export default createSchema({
  get: {
    parameters: z.object({ id: z.string() }),
    responses: {
      200: z.object({
        // TODO: Hookup with NetBalance
        balance: z.object({}),
      }),
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
})
