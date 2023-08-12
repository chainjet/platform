import { GetUserIntentAction } from './get-user-intent.action'

describe('GetUserIntentAction', () => {
  const action = new GetUserIntentAction()

  describe('beforeUpdate function', () => {
    it('should return update.nextActions if set', async () => {
      const update = {
        nextActions: [{ id: 1, condition: 'dummyAction' }],
      }

      const result = await action.beforeUpdate(update as any, {} as any, {} as any, null)
      expect(result.nextActions).toEqual([{ id: 1, condition: 'dummyAction' }])
    })

    it('should throw an error for duplicate intent names', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'intent1' }, { name: 'intent1' }],
        },
      }

      await expect(action.beforeUpdate(update as any, {} as any, {} as any, null)).rejects.toThrow(
        'Intents cannot have duplicate names.',
      )
    })

    it('should update action conditions for changed intent names and maintain their IDs', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'newIntent' }],
        },
      }
      const prevWorkflowAction = {
        inputs: {
          intents: [{ name: 'oldIntent' }],
        },
        nextActions: [{ id: 2, condition: 'oldIntent' }],
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.nextActions).toEqual([{ id: 2, condition: 'newIntent' }])
    })

    it('should maintain the order of actions based on the order of intents and preserve their IDs', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'intentB' }, { name: 'intentA' }],
        },
      }
      const prevWorkflowAction = {
        nextActions: [
          { id: 3, condition: 'intentA' },
          { id: 4, condition: 'intentB' },
        ],
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.nextActions).toEqual([
        { id: 4, condition: 'intentB' },
        { id: 3, condition: 'intentA' },
      ])
    })

    it('should filter out actions without a corresponding intent while preserving their IDs', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'intentA' }],
        },
      }
      const prevWorkflowAction = {
        nextActions: [
          { id: 5, condition: 'intentA' },
          { id: 6, condition: 'intentB' },
        ],
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.nextActions).toEqual([{ id: 5, condition: 'intentA' }])
    })
  })
})
