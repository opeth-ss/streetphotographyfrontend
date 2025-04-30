import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';
import { defineComponent } from 'vue';

import Navbar from '../../src/components/NavBar.vue';
import { useAuthStore } from '../../src/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Home', component: defineComponent({ template: '<div>Home</div>' }) },
    { path: '/login', name: 'Login', component: defineComponent({ template: '<div>Login Page</div>' }) },
  ],
});

describe('NavBar.vue', () => {
  beforeEach(async () => {
    router.push('/');
    await router.isReady();
  });

  const mountNavbarWithRole = (role: string) => {
    const pinia = createTestingPinia({
      initialState: {
        auth: {
          user: { role }, // Set user object with role
          isAuthenticated: true, // Optional: Set to align with store logic
        },
      },
      stubActions: false,
    });

    // Debug: Log the store state to verify
    const authStore = useAuthStore(pinia);
    console.log('authStore.role:', authStore.role, 'authStore.user:', authStore.user);

    return mount(Navbar, {
      global: {
        plugins: [pinia, router],
        stubs: {
          UserLinks: defineComponent({
            emits: ['logout'],
            template: '<button data-test="user-links" @click="$emit(\'logout\')">UserLinks</button>',
          }),
          AdminLinks: defineComponent({
            emits: ['logout'],
            template: '<button data-test="admin-links" @click="$emit(\'logout\')">AdminLinks</button>',
          }),
        },
      },
    });
  };

  it('renders UserLinks when role is "user"', () => {
    const wrapper = mountNavbarWithRole('user');
    expect(wrapper.find('[data-test="user-links"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="admin-links"]').exists()).toBe(false);
  });

  it('renders AdminLinks when role is "admin"', () => {
    const wrapper = mountNavbarWithRole('admin');
    expect(wrapper.find('[data-test="admin-links"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="user-links"]').exists()).toBe(false);
  });

  it('calls authStore.logout and navigates to /login on logout()', async () => {
    const wrapper = mountNavbarWithRole('user');
    const authStore = useAuthStore();
    console.log('authStore.role in logout test:', authStore.role); // Debug
    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue();
    const routerPushSpy = vi.spyOn(router, 'push');

    const userLinks = wrapper.find('[data-test="user-links"]');
    console.log('UserLinks exists:', userLinks.exists()); // Debug
    expect(userLinks.exists()).toBe(true);

    await userLinks.trigger('click');

    expect(logoutSpy).toHaveBeenCalled();
    expect(routerPushSpy).toHaveBeenCalledWith('/login');
  });
});