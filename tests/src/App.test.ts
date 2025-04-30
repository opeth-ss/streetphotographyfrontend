import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

describe('App.vue', () => {
  it('renders router-view component', () => {
    const wrapper = mount(App)
    // Check that the router-view exists
    expect(wrapper.find('router-view').exists()).toBe(true)
  })

  it('displays Preloader when loading is true', async () => {
    const wrapper = mount(App)
    // Check that Preloader is visible when loading is true
    expect(wrapper.findComponent({ name: 'Preloader' }).props().loading).toBe(true)
  })

  it('hides Preloader when loading is false', async () => {
    const wrapper = mount(App)
    // Simulate loading being set to false after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check that Preloader is not visible after loading is false
    expect(wrapper.findComponent({ name: 'Preloader' }).props().loading).toBe(false)
  })
})
