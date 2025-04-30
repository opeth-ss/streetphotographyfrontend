import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import PrimeVue from 'primevue/config';
import LoginView from '../../src/views/Login.vue';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import apiFetch from '../../src/api';
import { useAuthStore } from '../../src/stores/auth';

// Mock dependencies
vi.mock('../../src/api', () => ({
  default: vi.fn(),
}));
vi.mock('../../src/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

describe('LoginView', () => {
  let wrapper: VueWrapper<any>;
  let mockAuthStore: {
    setUser: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    refreshToken: ReturnType<typeof vi.fn>;
    getUser: { role: string; userName: string };
  };
  let mockRouter: {
    push: ReturnType<typeof vi.fn>;
    currentRoute: { value: { path: string } };
  };

  // Define routes
  const routes: RouteRecordRaw[] = [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
    { path: '/dashboard', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
  ];

  beforeEach(async () => {
    // Create fresh Pinia instance
    const pinia = createPinia();
    setActivePinia(pinia);

    // Mock auth store
    mockAuthStore = {
      setUser: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      getUser: { role: 'user', userName: 'testuser' },
    };
    (useAuthStore as any).mockReturnValue(mockAuthStore); // Cast to any to bypass TS2339

    // Mock router
    mockRouter = {
      push: vi.fn(),
      currentRoute: { value: { path: '/login' } },
    };

    // Create router instance
    const router = createRouter({
      history: createWebHistory(),
      routes,
    });

    // Clear mocks
    vi.clearAllMocks();
    (apiFetch as any).mockClear();

    // Mount component with PrimeVue plugin
    wrapper = mount(LoginView, {
      global: {
        plugins: [pinia, router, PrimeVue],
        stubs: {
          RouterLink: true,
        },
        components: {
          InputText,
          Password,
          Button,
          Dialog,
          Message,
        },
        mocks: {
          $router: mockRouter,
        },
      },
    });
  });


  it('disables the submit button when form is invalid', async () => {
    expect(wrapper.vm.isFormValid).toBe(false);
    expect(wrapper.findComponent(Button).attributes('disabled')).toBeDefined();

    await wrapper.findComponent(InputText).setValue('testuser');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isFormValid).toBe(false);
    expect(wrapper.findComponent(Button).attributes('disabled')).toBeDefined();

    await wrapper.findComponent(InputText).setValue('');
    await wrapper.findComponent(Password).setValue('password123');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isFormValid).toBe(false);
    expect(wrapper.findComponent(Button).attributes('disabled')).toBeDefined();
  });

  it('enables the submit button when form is valid', async () => {
    await wrapper.findComponent(InputText).setValue('testuser');
    await wrapper.findComponent(Password).setValue('password123');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isFormValid).toBe(true);
    expect(wrapper.findComponent(Button).attributes('disabled')).toBeUndefined();
  });

  it('shows error message when form is submitted with empty fields', async () => {
    await wrapper.find('form').trigger('submit.prevent');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.errorMessage).toBe('Please enter both username and password');
    expect(wrapper.findComponent(Message).exists()).toBe(true);
  });


  it('handles 401 unauthorized error', async () => {
    (apiFetch as any).mockRejectedValueOnce(new Error('401 Unauthorized'));

    await wrapper.findComponent(InputText).setValue('testuser');
    await wrapper.findComponent(Password).setValue('wrongpassword');
    await wrapper.find('form').trigger('submit.prevent');

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.errorMessage).toBe('Invalid username or password');
    expect(wrapper.findComponent(Message).text()).toContain('Invalid username or password');
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.showSuccessPopup).toBe(false);
  });

  it('handles generic login error', async () => {
    (apiFetch as any).mockRejectedValueOnce(new Error('Server Error'));

    await wrapper.findComponent(InputText).setValue('testuser');
    await wrapper.findComponent(Password).setValue('password123');
    await wrapper.find('form').trigger('submit.prevent');

    await wrapper.vm.$nextTick();
    expect(wrapper.vm.errorMessage).toBe('Login failed. Please try again.');
    expect(wrapper.findComponent(Message).text()).toContain('Login failed. Please try again.');
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.showSuccessPopup).toBe(false);
  });



  it('focuses password field when pressing enter on username', async () => {
    const focusMock = vi.fn();
    wrapper.vm.passwordInput = { $el: { querySelector: () => ({ focus: focusMock }) } };

    await wrapper.findComponent(InputText).trigger('keyup.enter');
    expect(focusMock).toHaveBeenCalled();
  });


});