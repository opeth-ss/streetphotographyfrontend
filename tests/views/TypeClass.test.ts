import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import UserProfile from '../../src/views/TypeClass.vue'; // Adjust the path as needed

describe('UserProfile.vue', () => {
  it('displays user information correctly when user data is available', async () => {
    const wrapper = mount(UserProfile);

    // Assert that the user data is displayed correctly
    expect(wrapper.text()).toContain('Name: John Doe');
    expect(wrapper.text()).toContain('Email: john.doe@example.com');
    expect(wrapper.text()).toContain('Age: 30');
    expect(wrapper.text()).toContain('Status: Active');
  });

  it('updates user age and lastLogin when updateUser is called', async () => {
    const wrapper = mount(UserProfile);

    // Trigger the updateUser method
    await wrapper.find('button').trigger('click');

    // Get the updated user data
    const updatedUser = wrapper.vm.user;

    // Assert that the user data was updated correctly
    expect(updatedUser?.age).toBe(31); // Age should increase by 1
    expect(updatedUser?.lastLogin).toBeInstanceOf(Date); // lastLogin should be a Date
  });
});
