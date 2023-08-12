import { GetUserIntentAction } from './get-user-intent.action'

describe('GetUserIntentAction', () => {
  const action = new GetUserIntentAction()

  describe('beforeUpdate function', () => {
    it('should return update.nextActions if set', async () => {
      const update = {
        nextActions: [{ id: 1, condition: 'intent' }],
      }
      const prevWorkflowAction = {
        inputs: {
          intents: [{ name: 'intent' }],
        },
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.nextActions).toEqual([{ id: 1, condition: 'intent' }])
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

    it('should update action conditions for changed intent names', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'newIntent' }, { name: 'intent2' }],
        },
      }
      const prevWorkflowAction = {
        inputs: {
          intents: [{ name: 'oldIntent' }, { name: 'intent2' }],
        },
        nextActions: [
          { id: 1, condition: 'oldIntent' },
          { id: 2, condition: 'intent2' },
        ],
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.nextActions).toEqual([
        { id: 1, condition: 'newIntent' },
        { id: 2, condition: 'intent2' },
      ])
    })

    it('should maintain the order of actions based on the order of intents', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'intentA' }, { name: 'intentB' }, { name: 'intentC' }, { name: 'intentD' }],
        },
      }
      const prevWorkflowAction = {
        nextActions: [
          { id: 3, condition: 'intentC' },
          { id: 4, condition: 'intentD' },
          { id: 2, condition: 'intentB' },
        ],
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.inputs?.intents).toEqual([
        { name: 'intentA' },
        { name: 'intentB' },
        { name: 'intentC' },
        { name: 'intentD' },
      ])
      expect(result.nextActions).toEqual([
        { id: 2, condition: 'intentB' },
        { id: 3, condition: 'intentC' },
        { id: 4, condition: 'intentD' },
      ])
    })

    it('should throw an error if an intent is removed while it has a next action', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'intentA' }],
        },
      }
      const prevWorkflowAction = {
        nextActions: [
          { id: 1, condition: 'intentA' },
          { id: 2, condition: 'intentB' },
        ],
      }

      await expect(action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)).rejects.toThrow(
        'All actions must be associated with a valid intent.',
      )
    })

    it('should throw an error if any intent name is empty', async () => {
      const update = {
        inputs: {
          intents: [{ name: '' }],
        },
      }

      await expect(action.beforeUpdate(update as any, {} as any, {} as any, null)).rejects.toThrow(
        'All intents must have a name.',
      )
    })

    it('should throw an error if any next action condition is empty', async () => {
      const update = {
        nextActions: [{ id: 1, condition: '' }],
      }

      await expect(action.beforeUpdate(update as any, {} as any, {} as any, null)).rejects.toThrow(
        'All next actions must have a condition.',
      )
    })

    it('should throw an error for duplicate next action conditions', async () => {
      const update = {
        nextActions: [
          { id: 1, condition: 'intent1' },
          { id: 2, condition: 'intent1' },
        ],
      }

      await expect(action.beforeUpdate(update as any, {} as any, {} as any, null)).rejects.toThrow(
        'All next actions must have a unique condition.',
      )
    })

    it('should maintain original intent names if they are not changed', async () => {
      const update = {
        inputs: {
          intents: [{ name: 'intent1' }, { name: 'intent2' }],
        },
      }
      const prevWorkflowAction = {
        inputs: {
          intents: [{ name: 'intent1' }, { name: 'intent2' }],
        },
        nextActions: [
          { id: 1, condition: 'intent1' },
          { id: 2, condition: 'intent2' },
        ],
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.nextActions).toEqual([
        { id: 1, condition: 'intent1' },
        { id: 2, condition: 'intent2' },
      ])
    })

    it('should correctly process only updated next actions without updated intents', async () => {
      const update = {
        nextActions: [
          { id: 2, condition: 'intent2' },
          { id: 1, condition: 'intent1' },
          { id: 3, condition: 'intent3' },
        ],
      }
      const prevWorkflowAction = {
        inputs: {
          intents: [{ name: 'intent1' }, { name: 'intent2' }, { name: 'intent3' }, { name: 'intent4' }],
        },
        nextActions: [
          { id: 1, condition: 'intent1' },
          { id: 2, condition: 'intent2' },
          { id: 3, condition: 'intent3' },
          { id: 4, condition: 'intent4' },
        ],
      }

      const result = await action.beforeUpdate(update as any, prevWorkflowAction as any, {} as any, null)
      expect(result.inputs?.intents).not.toBeDefined()
      expect(result.nextActions).toEqual([
        { id: 1, condition: 'intent1' },
        { id: 2, condition: 'intent2' },
        { id: 3, condition: 'intent3' },
      ])
    })
  })
})
