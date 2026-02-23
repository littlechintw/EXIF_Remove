import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MetadataViewer from './MetadataViewer.vue'

describe('MetadataViewer.vue', () => {
  const mockMetadata = {
    'Make': 'Apple',
    'Model': 'iPhone 13',
    'DateTime': '2023:01:01 12:00:00'
  }

  it('renders metadata fields correctly', () => {
    const wrapper = mount(MetadataViewer, {
      props: {
        metadata: mockMetadata
      }
    })

    expect(wrapper.text()).toContain('Make')
    expect(wrapper.text()).toContain('Apple')
    expect(wrapper.text()).toContain('Model')
    expect(wrapper.text()).toContain('iPhone 13')
    expect(wrapper.text()).toContain('3 fields')
  })

  it('shows "No metadata found" when metadata is empty', () => {
    const wrapper = mount(MetadataViewer, {
      props: {
        metadata: {}
      }
    })

    expect(wrapper.text()).toContain('No metadata found')
  })

  it('selects all fields when "Select All" is clicked', async () => {
    const wrapper = mount(MetadataViewer, {
      props: {
        metadata: mockMetadata
      }
    })

    const buttons = wrapper.findAll('button')
    const selectAllBtn = buttons.find(b => b.text().includes('Select All'))
    await selectAllBtn?.trigger('click')
    
    expect(wrapper.text()).toContain('3 field(s) selected to keep')
    
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    checkboxes.forEach(checkbox => {
      expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    })
  })

  it('deselects all fields when "Deselect All" is clicked', async () => {
    const wrapper = mount(MetadataViewer, {
      props: {
        metadata: mockMetadata
      }
    })

    const buttons = wrapper.findAll('button')
    const selectAllBtn = buttons.find(b => b.text().includes('Select All'))
    const deselectAllBtn = buttons.find(b => b.text().includes('Deselect All'))

    // First select all
    await selectAllBtn?.trigger('click')
    expect(wrapper.text()).toContain('3 field(s) selected to keep')

    // Then deselect all
    await deselectAllBtn?.trigger('click')
    expect(wrapper.text()).toContain('0 field(s) selected to keep')
  })

  it('emits selectionChanged event when checkboxes are toggled', async () => {
    const wrapper = mount(MetadataViewer, {
      props: {
        metadata: mockMetadata
      }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)

    expect(wrapper.emitted()).toHaveProperty('selectionChanged')
    const events = wrapper.emitted('selectionChanged')
    if (events && events.length > 0) {
      const lastEvent = events[events.length - 1][0] as string[]
      expect(lastEvent).toContain('Make')
    }
  })
})
