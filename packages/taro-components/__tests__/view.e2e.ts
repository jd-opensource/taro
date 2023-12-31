import { E2EPage, newE2EPage } from '@stencil/core/testing'

describe('View e2e', () => {
  let page: E2EPage

  beforeEach(async () => {
    page = await newE2EPage({
      html: `<taro-view-core></taro-view-core>`,
    })
  })

  // Note: E2E 测试的文件，不能包含引入，否则会导致测试失败
  it.skip('screenshot', async () => {
    await page.waitForChanges()
    await page.compareScreenshot()
  })
})
