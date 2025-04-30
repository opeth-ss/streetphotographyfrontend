import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createRouter, createWebHistory } from 'vue-router';
import { createTestingPinia } from '@pinia/testing';
import { useToast } from 'primevue/usetoast';
import PrimeVue from 'primevue/config';
import RegisterForm from '../../src/views/Register.vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Message from 'primevue/message';

// Mock PrimeVue's useToast
vi.mock('primevue/usetoast', () => ({
  useToast: vi.fn(() => ({
    add: vi.fn(),
  })),
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('RegisterForm', () => {
  let wrapper: any;
  let router: any;
  let toast: any;

  beforeEach(async () => {
    // Setup router with a catch-all route to avoid "No match found" warnings
    router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: { template: '<div>Not Found</div>' } },
      ],
    });

    // Mock toast
    toast = useToast();

    // Mount component with PrimeVue plugin
    wrapper = mount(RegisterForm, {
      global: {
        plugins: [
          router,
          createTestingPinia(),
          PrimeVue, // Add PrimeVue plugin
        ],
        components: { InputText, Password, Button, Toast, Message },
        stubs: ['Toast', 'Message'],
        provide: {
          $primevue: {
            config: {}, // Provide a minimal $primevue config
          },
        },
      },
    });

    // Reset fetch mock
    (fetch as any).mockReset();
  });


  it('disables submit button when form is invalid', async () => {
    await wrapper.setData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });

  it('enables submit button when form is valid', async () => {
    await wrapper.setData({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
  });

  it('shows error message for mismatched passwords', async () => {
    await wrapper.setData({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.vm.errorMessage).toBe('Passwords do not match');
  });

  it('handles username already exists error', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({}),
    });

    await wrapper.setData({
      username: 'existinguser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.errorMessage).toBe('Username already exists');
  });

  it('handles network error', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    await wrapper.setData({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.errorMessage).toBe('Network error. Please check your connection.');
  });

  it('focuses next input on enter key', async () => {
    const usernameInput = wrapper.find('#username');
    const emailInput = wrapper.find('#email').element;
    vi.spyOn(emailInput, 'focus');

    await usernameInput.trigger('keyup.enter');
    expect(emailInput.focus).toHaveBeenCalled();
  });
});