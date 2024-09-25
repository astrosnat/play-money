import { z } from 'zod'
import { ServerErrorSchema, createSchema } from '@play-money/api-helpers'
import { ListSchema } from '@play-money/database'

export default createSchema({
  get: {
    parameters: ListSchema.pick({ id: true }).extend({ extended: z.boolean().optional() }),
    responses: {
      200: ListSchema,
      404: ServerErrorSchema,
      500: ServerErrorSchema,
    },
  },
})
