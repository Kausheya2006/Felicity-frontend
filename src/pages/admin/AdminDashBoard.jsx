import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPendingOrganizers, approveOrganizer, rejectOrganizer, createOrganizer, getAllOrganizers, removeOrganizer, resetOrganizerPassword, getStatistics } from '../../api/adminService';
import Navbar from '../../components/Navbar';
import Button from '../../components/Button';
import Card from '../../components/Card';

const AdminDashBoard = () => {

    const {user, logout} = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('create'); 
    const [pendingOrganizers, setPendingOrganizers] = useState([]);
    const [allOrganizers, setAllOrganizers] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showResetPasswordForm, setShowResetPasswordForm] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [statistics, setStatistics] = useState(null);
    const [createdCredentials, setCreatedCredentials] = useState(null);
    
    const [newOrganizer, setNewOrganizer] = useState({
        name: '',
        email: '',
        password: '',
        category: '',
        description: '', 
        contactEmail: '', 
        contactNumber: ''
    });

    const handleLogout = () => {
        logout();
        navigate('/login');  
    }

    useEffect(() => {
        fetchAllOrganizers();
        fetchStatistics();
    }, []);

    
    const fetchStatistics = async () => {
        try {
            const data = await getStatistics();
            setStatistics(data);  
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
            // Set default values if endpoint not ready yet
            setStatistics({
                totalOrganizers: 0,
                verifiedOrganizers: 0,
                pendingOrganizers: 0,
                totalEvents: 0,
                totalParticipants: 0,
                totalRegistrations: 0
            });
        }
    };

    const fetchAllOrganizers = async () => {
        try {
            const data = await getAllOrganizers();
            setAllOrganizers(data.organizers);  
        } catch (err) {
            alert('Failed to fetch organizers. Please try again.');   
        }
    };

    const handleCreateOrganizer = async (e) => {
        e.preventDefault(); // prevent default form submission behavior (page reload)
        try {
            const result = await createOrganizer(newOrganizer);
            
            // Store credentials to show to admin
            setCreatedCredentials({
                email: newOrganizer.email,
                password: newOrganizer.password,
                name: newOrganizer.name
            });
            
            setNewOrganizer({
                email: '',
                password: '',
                name: '',
                category: '',
                description: '',
                contactEmail: '',
                contactNumber: ''
            }); // reset form
            fetchAllOrganizers(); // refresh organizer list
            fetchStatistics(); // refresh statistics
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create organizer. Please try again.');   
        }
    };

    const handleRemoveOrganizer = async (organizerId, permanent = false) => {
        const message = permanent 
            ? 'Are you sure you want to permanently delete this organizer?' 
            : 'Are you sure you want to deactivate this organizer?';
        
        if (!window.confirm(message)) return;
        
        try {
            await removeOrganizer(organizerId, permanent);
            alert(permanent ? 'Organizer deleted permanently!' : 'Organizer deactivated!');
            fetchAllOrganizers();
        } catch (err) {
            alert('Failed to remove organizer. Please try again.');   
        }
    };

    const handleResetPassword = async (id) => {
        if (!newPassword) {
            alert('Please enter a new password');
            return;
        }

        try {
            await resetOrganizerPassword(id, newPassword);
            alert('Password reset successfully!');
            setShowResetPasswordForm(null);
            setNewPassword('');
        } catch (err) {
            alert('Failed to reset password. Please try again.');   
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar title="Admin Dashboard" />

            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('create')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'create'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Create Organizer
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'manage'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Manage Organizers
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'stats'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Statistics
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* CREATE ORGANIZER */}
                {activeTab === 'create' && (
                    <Card title="Create New Organizer">
                        {createdCredentials && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Organizer Created Successfully!</h3>
                                <p className="text-sm text-green-700 mb-3">Share these credentials with the organizer:</p>
                                <div className="bg-white p-4 rounded border border-green-300">
                                    <p className="mb-2"><span className="font-semibold">Organization:</span> {createdCredentials.name}</p>
                                    <p className="mb-2"><span className="font-semibold">Email:</span> {createdCredentials.email}</p>
                                    <p className="mb-2"><span className="font-semibold">Password:</span> {createdCredentials.password}</p>
                                </div>
                                <button 
                                    onClick={() => setCreatedCredentials(null)}
                                    className="mt-3 text-sm text-green-700 hover:text-green-900 underline"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleCreateOrganizer} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                                    <input 
                                        type="email" 
                                        value={newOrganizer.email}
                                        onChange={(e) => setNewOrganizer({...newOrganizer, email: e.target.value})}
                                        required 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                                    <input 
                                        type="password" 
                                        value={newOrganizer.password}
                                        onChange={(e) => setNewOrganizer({...newOrganizer, password: e.target.value})}
                                        required 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name:</label>
                                    <input 
                                        type="text" 
                                        value={newOrganizer.name}
                                        onChange={(e) => setNewOrganizer({...newOrganizer, name: e.target.value})}
                                        required 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category:</label>
                                    <input 
                                        type="text" 
                                        value={newOrganizer.category}
                                        onChange={(e) => setNewOrganizer({...newOrganizer, category: e.target.value})}
                                        required 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email:</label>
                                    <input 
                                        type="email" 
                                        value={newOrganizer.contactEmail}
                                        onChange={(e) => setNewOrganizer({...newOrganizer, contactEmail: e.target.value})}
                                        required 
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number:</label>
                                    <input 
                                        type="tel" 
                                        value={newOrganizer.contactNumber}
                                        onChange={(e) => setNewOrganizer({...newOrganizer, contactNumber: e.target.value})}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                                <textarea 
                                    value={newOrganizer.description}
                                    onChange={(e) => setNewOrganizer({...newOrganizer, description: e.target.value})}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                            
                            <Button type="submit" variant="success" className="w-full">Create Organizer</Button>
                        </form>
                    </Card>
                )}



                {/* MANAGE ORGANIZERS */}
                {activeTab === 'manage' && (
                    <Card title="All Organizers">
                        {allOrganizers.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No organizers found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {allOrganizers.map((org) => (
                                            <tr key={org._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{org.organizerProfile?.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{org.organizerProfile?.category}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        org.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {org.isVerified ? 'Verified' : 'Not Verified'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {showResetPasswordForm === org._id ? (
                                                        <div className="flex items-center space-x-2">
                                                            <input 
                                                                type="password" 
                                                                placeholder="New Password"
                                                                value={newPassword}
                                                                onChange={(e) => setNewPassword(e.target.value)}
                                                                className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                                            />
                                                            <Button onClick={() => handleResetPassword(org._id)} size="sm" variant="success">Submit</Button>
                                                            <Button onClick={() => {
                                                                setShowResetPasswordForm(null);
                                                                setNewPassword('');
                                                            }} size="sm" variant="secondary">Cancel</Button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-x-2">
                                                            <Button onClick={() => setShowResetPasswordForm(org._id)} size="sm" variant="info">Reset Password</Button>
                                                            <Button onClick={() => handleRemoveOrganizer(org._id, false)} size="sm" variant="warning">Deactivate</Button>
                                                            <Button onClick={() => handleRemoveOrganizer(org._id, true)} size="sm" variant="danger">Delete</Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                )}

                {/* STATISTICS */}
                {activeTab === 'stats' && (
                    <Card title="System Statistics">
                        {statistics ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-blue-50 rounded-lg p-6">
                                    <p className="text-sm font-medium text-blue-600 mb-1">Total Organizers</p>
                                    <p className="text-3xl font-bold text-blue-900">{statistics.totalOrganizers}</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-6">
                                    <p className="text-sm font-medium text-green-600 mb-1">Verified Organizers</p>
                                    <p className="text-3xl font-bold text-green-900">{statistics.verifiedOrganizers}</p>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-6">
                                    <p className="text-sm font-medium text-yellow-600 mb-1">Pending Approvals</p>
                                    <p className="text-3xl font-bold text-yellow-900">{statistics.pendingOrganizers}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-6">
                                    <p className="text-sm font-medium text-purple-600 mb-1">Total Events</p>
                                    <p className="text-3xl font-bold text-purple-900">{statistics.totalEvents}</p>
                                </div>
                                <div className="bg-indigo-50 rounded-lg p-6">
                                    <p className="text-sm font-medium text-indigo-600 mb-1">Total Participants</p>
                                    <p className="text-3xl font-bold text-indigo-900">{statistics.totalParticipants}</p>
                                </div>
                                <div className="bg-pink-50 rounded-lg p-6">
                                    <p className="text-sm font-medium text-pink-600 mb-1">Total Registrations</p>
                                    <p className="text-3xl font-bold text-pink-900">{statistics.totalRegistrations}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">Loading statistics...</p>
                            </div>
                        )}
                    </Card>
                )}
            </main>
        </div>
    )
}

export default AdminDashBoard