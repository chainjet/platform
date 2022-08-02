import { mongoose, prop } from '@typegoose/typegoose'
import { PropType } from '@typegoose/typegoose/lib/internal/constants'
import { PropOptionsForString } from '@typegoose/typegoose/lib/types'

/**
 * Settings for storing JSON and parsing it in the model.
 * Objects with certain keys can't be directly stored in mongo (e.g. starting with `$` or containing `.`).
 */
export function jsonProp(options?: PropOptionsForString, kind?: PropType): PropertyDecorator {
  return prop(
    {
      type: mongoose.Schema.Types.String,
      get: (val) => (val ? JSON.parse(val) : undefined),
      set: (val) => (val ? JSON.stringify(val) : undefined),
      ...options,
    },
    kind,
  )
}
