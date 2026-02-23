import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FileUploader from './FileUploader.vue'

describe('FileUploader.vue', () => {
  it('renders with help text', () => {
    const wrapper = mount(FileUploader, {
      props: {
        accept: 'image/*',
        helpText: 'Supports JPG, PNG'
      }
    })

    expect(wrapper.text()).toContain('Supports JPG, PNG')
    expect(wrapper.text()).toContain('Click to upload')
  })

  it('emits file-selected when a file is dropped', async () => {
    const wrapper = mount(FileUploader, {
      props: {
        accept: 'image/*',
        helpText: 'Supports JPG, PNG'
      }
    })

    const file = new File([''], 'test.png', { type: 'image/png' })
    const dropEvent = {
        dataTransfer: {
            files: [file]
        }
    }

    await wrapper.find('div.border-2').trigger('drop', dropEvent)
    
    expect(wrapper.emitted()).toHaveProperty('file-selected')
    const events = wrapper.emitted('file-selected')
    if (events && events[0]) {
      const payload = events[0][0] as File
      expect(payload).toBe(file)
    }
  })

  it('does not emit file-selected when an unaccepted file is dropped', async () => {
    const wrapper = mount(FileUploader, {
      props: {
        accept: 'image/*',
        helpText: 'Supports JPG'
      }
    })

    const file = new File([''], 'test.txt', { type: 'text/plain' })
    const dropEvent = {
        dataTransfer: {
            files: [file]
        }
    }

    await wrapper.find('div.border-2').trigger('drop', dropEvent)
    expect(wrapper.emitted('file-selected')).toBeUndefined()
  })
})
