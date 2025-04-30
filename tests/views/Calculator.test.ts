import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Divider from 'primevue/divider'
import Calculator from '../../src/views/Calculator.vue' // Adjust the path as needed
import { describe, it, expect, beforeEach } from 'vitest'

describe('Calculator.vue', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(Calculator, {
      global: {
        plugins: [[PrimeVue, { ripple: true }]],
        components: {
          InputNumber,
          Button,
          Card,
          Divider,
        },
      },
    })
  })

  const setInputs = async (first: number, second: number) => {
    await wrapper.vm.resetResults()
    wrapper.vm.firstNumber = first
    wrapper.vm.secondNumber = second
  }

  it('renders the calculator correctly', () => {
    expect(wrapper.text()).toContain('Simple Calculator')
  })

  it('validates missing inputs', async () => {
    await wrapper.vm.add()
    expect(wrapper.vm.firstNumberError).toBe('First number is required')
    expect(wrapper.vm.secondNumberError).toBe('Second number is required')
    expect(wrapper.vm.showResult).toBe(false)
  })

  it('adds two numbers correctly', async () => {
    await setInputs(10, 5)
    await wrapper.vm.add()
    expect(wrapper.vm.sumResult).toBe(15)
    expect(wrapper.vm.activeOperation).toBe('add')
    expect(wrapper.vm.showResult).toBe(true)
  })

  it('multiplies two numbers correctly', async () => {
    await setInputs(4, 6)
    await wrapper.vm.multiply()
    expect(wrapper.vm.productResult).toBe(24)
    expect(wrapper.vm.activeOperation).toBe('multiply')
    expect(wrapper.vm.showResult).toBe(true)
  })

  it('divides two numbers correctly', async () => {
    await setInputs(20, 4)
    await wrapper.vm.divide()
    expect(wrapper.vm.divideResult).toBe(5)
    expect(wrapper.vm.activeOperation).toBe('divide')
    expect(wrapper.vm.showResult).toBe(true)
  })

  it('prevents division by zero', async () => {
    await setInputs(20, 0)
    await wrapper.vm.divide()
    expect(wrapper.vm.divideError).toBe('Cannot divide by zero')
    expect(wrapper.vm.showResult).toBe(false)
  })

  it('formats numbers to 2 decimal places', () => {
    const formatted = wrapper.vm.formatNumber(12.3456)
    expect(formatted).toBe('12.35')
  })
})
