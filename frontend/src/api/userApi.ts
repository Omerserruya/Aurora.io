export const fetchUserDetails = async (userId: string) => {
  try {
    const response = await fetch(`/users/${userId}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const updatePassword = async (userId: string, password: string) => {
  try {
    const response = await fetch(`/users/${userId}/password`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        password
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update password');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};
