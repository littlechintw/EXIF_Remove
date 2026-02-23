import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QualityControl from './QualityControl.vue'

describe('QualityControl.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(QualityControl)

    expect(wrapper.text()).toContain('Quality Control')
    const input = wrapper.find('input[type="range"]')
    expect(input.exists()).toBe(true)
  })

  it('emits qualityChanged when slider changes', async () => {
    const wrapper = mount(QualityControl)

    const input = wrapper.find('input[type="range"]')
    await input.setValue(80)

    expect(wrapper.emitted()).toHaveProperty('qualityChanged')
    const events = wrapper.emitted('qualityChanged')
    if (events && events.length > 0) {
      const event = events[events.length - 1]
      if (event) {
        // Find the last event
        const lastEvent = event[0]
        expect(lastEvent).toBe(0.8)
      }
    }
  })
})
