import { TypegooseQueryService } from '@app/common/TypegooseQueryService'
import { getQueryServiceToken } from '@nestjs-query/core'
import { DynamicModule, FactoryProvider } from '@nestjs/common'
import { ReturnModelType } from '@typegoose/typegoose'
import { getModelToken, TypegooseModule } from 'nestjs-typegoose'
import { TypegooseClass } from 'nestjs-typegoose/dist/typegoose-class.interface'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NestjsQueryTypegooseModule {
  static forFeature (models: TypegooseClass[], connectionName?: string): DynamicModule {
    const queryServiceProviders = createTypeOrmQueryServiceProviders(models)
    const typegooseModule = TypegooseModule.forFeature(models, connectionName)
    return {
      imports: [typegooseModule],
      module: NestjsQueryTypegooseModule,
      providers: [...queryServiceProviders],
      exports: [...queryServiceProviders, typegooseModule]
    }
  }
}

function createTypeOrmQueryServiceProvider<Entity> (
  model: TypegooseClass
): FactoryProvider {
  return {
    provide: getQueryServiceToken(model),
    useFactory (modelClass: ReturnModelType<new () => Entity>) {
      return new TypegooseQueryService(modelClass)
    },
    inject: [getModelToken(model.name)]
  }
}

const createTypeOrmQueryServiceProviders = (
  models: TypegooseClass[]
): FactoryProvider[] => models.map((model) => createTypeOrmQueryServiceProvider(model))
