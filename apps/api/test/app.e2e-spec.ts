import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'

describe('API App (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  // test if GraphQL is running
  it('/graphql (POST)', async () => {
    const schemaQuery = `
      {
        __schema {
          types {
            name
          }
        }
      }
    `

    const res = await request(app.getHttpServer()).post('/graphql').send({ query: schemaQuery }).expect(200)

    expect(res.body.data.__schema.types).toBeInstanceOf(Array)
    const types: string[] = res.body.data.__schema.types.map((type) => type.name)
    expect(types).toEqual(expect.arrayContaining(['ID', 'Boolean', 'Int', 'String', 'DateTime', 'User', 'Workflow']))
  })
})
