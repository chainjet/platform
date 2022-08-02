import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'

@Injectable()
export class OwnershipService {
  constructor(private readonly moduleRef: ModuleRef) {}

  canAccess(modelName: string): Promise<boolean> {
    throw new Error('')
  }
}
