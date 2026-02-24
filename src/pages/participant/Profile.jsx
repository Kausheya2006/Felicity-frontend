import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword } from '../../api/participantService';
import { getAllOrganizers, followOrganizer, unfollowOrganizer } from '../../api/participantService';
import Navbar from '../../components/Navbar';
import Card from '../../components/Card';
import Button from '../../components/Button';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    contactNumber: '',
    college: '',
    interests: [],
    followedClubs: []
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [allOrganizers, setAllOrganizers] = useState([]);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchOrganizers();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getProfile();
      setProfile(data);
      setFormData({
        firstname: data.participantProfile?.firstname || '',
        lastname: data.participantProfile?.lastname || '',
        contactNumber: data.participantProfile?.contactNumber || '',
        college: data.participantProfile?.college || '',
        interests: data.participantProfile?.interests || [],
        followedClubs: data.participantProfile?.followedClubs || []
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrganizers = async () => {
    try {
      const data = await getAllOrganizers();
      setAllOrganizers(data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      alert('Profile updated successfully!');
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      alert('Password changed successfully!');
      setPasswordMode(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleAddInterest = () => {
    if (newInterest && !formData.interests.includes(newInterest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const handleToggleFollow = async (organizerId) => {
    try {
      // Check if already following (handle both string and object IDs)
      const followedIds = formData.followedClubs.map(club => 
        typeof club === 'string' ? club : club._id || club
      );
      
      if (followedIds.includes(organizerId)) {
        await unfollowOrganizer(organizerId);
        setFormData({
          ...formData,
          followedClubs: formData.followedClubs.filter(club => {
            const clubId = typeof club === 'string' ? club : club._id || club;
            return clubId !== organizerId;
          })
        });
        alert('Unfollowed successfully');
      } else {
        await followOrganizer(organizerId);
        setFormData({
          ...formData,
          followedClubs: [...formData.followedClubs, organizerId]
        });
        alert('Followed successfully');
      }
      fetchProfile();
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Failed to update followed clubs');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Profile" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="My Profile" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Basic Information Card */}
        <Card title="Profile Information">
          {!editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email (Non-Editable)</p>
                  <p className="text-lg text-gray-900">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Participant Type (Non-Editable)</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {profile.participantProfile?.participantType || 'N/A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">First Name</p>
                  <p className="text-lg text-gray-900">{formData.firstname || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Name</p>
                  <p className="text-lg text-gray-900">{formData.lastname || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Number</p>
                  <p className="text-lg text-gray-900">{formData.contactNumber || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">College/Organization</p>
                  <p className="text-lg text-gray-900">{formData.college || 'Not set'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.length > 0 ? (
                    formData.interests.map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No interests added</p>
                  )}
                </div>
              </div>

              <Button onClick={() => setEditMode(true)} variant="primary">
                Edit Profile
              </Button>
            </div>
          ) : (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College/Organization</label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    disabled={profile.participantProfile?.participantType === 'IIIT'}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${profile.participantProfile?.participantType === 'IIIT' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  {profile.participantProfile?.participantType === 'IIIT' && (
                    <p className="text-xs text-gray-500 mt-1">College is locked for IIIT participants</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Button type="button" onClick={handleAddInterest} variant="secondary">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" variant="success">
                  Save Changes
                </Button>
                <Button type="button" onClick={() => setEditMode(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Followed Clubs Card */}
        <Card title="Followed Clubs">
          <div className="space-y-3">
            {formData.followedClubs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't followed any clubs yet</p>
                <p className="text-sm text-gray-400 mt-2">Visit the Clubs page to follow organizers</p>
              </div>
            ) : (
              formData.followedClubs.map((club) => {
                const clubId = typeof club === 'string' ? club : club._id;
                const organizer = allOrganizers.find(org => org._id === clubId);
                
                if (!organizer) return null;
                
                return (
                  <div key={clubId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{organizer.organizerProfile?.name}</p>
                      <p className="text-sm text-gray-500">{organizer.organizerProfile?.category}</p>
                    </div>
                    <Button
                      onClick={() => handleToggleFollow(clubId)}
                      variant="danger"
                      size="sm"
                    >
                      Unfollow
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Security Settings Card */}
        <Card title="Security Settings">
          {!passwordMode ? (
            <Button onClick={() => setPasswordMode(true)} variant="primary">
              Change Password
            </Button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="success">
                  Change Password
                </Button>
                <Button type="button" onClick={() => setPasswordMode(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Profile;
