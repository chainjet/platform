import { RunResponse } from '@app/definitions'
import { Observable } from 'rxjs'

export async function convertObservableToRunResponse(res: RunResponse | Observable<RunResponse>): Promise<RunResponse> {
  if ('outputs' in res) {
    return res
  }
  return new Promise((resolve, reject) => {
    const items: any[] = []
    let store: RunResponse['store']
    res.subscribe({
      next(item) {
        items.push(item.outputs)
        store = item.store
      },
      error(err) {
        reject(err)
      },
      complete() {
        resolve({ outputs: { items }, store })
      },
    })
  })
}
